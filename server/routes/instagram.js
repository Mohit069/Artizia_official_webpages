/* ============================================================
   Instagram feed — Meta Graph API (Instagram Basic Display).

   Instagram serves a login wall to unauthenticated requests, so the feed
   cannot be read from the browser. The server fetches it with a long-lived
   token, caches the result on disk, and the homepage reads our own endpoint.

   Long-lived tokens expire after 60 days. We refresh at the 45-day mark and
   persist the new token to server/cache/ig-token.json, which is preferred over
   the .env value — so the feed keeps working without anyone touching the box.

   Setup (one time):
     1. @artizia_by_marudhar must be a Business or Creator account
     2. link it to a Facebook Page
     3. create a Meta app, add "Instagram Basic Display"
     4. generate a long-lived token -> IG_ACCESS_TOKEN in .env
   ============================================================ */
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const FEED_FILE = path.join(CACHE_DIR, 'instagram.json');
const TOKEN_FILE = path.join(CACHE_DIR, 'ig-token.json');
fs.mkdirSync(CACHE_DIR, { recursive: true });

const TTL_MS = 60 * 60 * 1000;               // re-fetch the feed at most hourly
const REFRESH_AFTER_MS = 45 * 24 * 60 * 60 * 1000;  // refresh token well before its 60-day expiry
const FIELDS = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';

const readJSON = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const writeJSON = (f, o) => { try { fs.writeFileSync(f, JSON.stringify(o)); } catch { /* cache is best-effort */ } };

/* the freshest token we hold: the refreshed one on disk, else the one in .env */
function currentToken() {
  const stored = readJSON(TOKEN_FILE);
  if (stored && stored.token) return stored;
  const env = process.env.IG_ACCESS_TOKEN;
  return env ? { token: env, obtained: 0 } : null;
}

async function maybeRefresh(tok) {
  if (Date.now() - (tok.obtained || 0) < REFRESH_AFTER_MS) return tok;
  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${tok.token}`;
    const r = await fetch(url);
    if (!r.ok) return tok;                    // keep using the old one; it is still valid for a while
    const j = await r.json();
    if (!j.access_token) return tok;
    const next = { token: j.access_token, obtained: Date.now() };
    writeJSON(TOKEN_FILE, next);
    console.log('[instagram] access token refreshed');
    return next;
  } catch {
    return tok;
  }
}

/* GET /api/instagram -> { posts: [...] }  (never throws; falls back to cache) */
router.get('/', async (req, res) => {
  const cached = readJSON(FEED_FILE);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return res.json({ posts: cached.posts, cached: true });
  }

  let tok = currentToken();
  if (!tok) {
    // not configured yet — the homepage hides the section rather than showing an empty grid
    return res.json({ posts: [], configured: false });
  }
  tok = await maybeRefresh(tok);

  try {
    const limit = Math.min(parseInt(req.query.limit || '12', 10) || 12, 25);
    const url = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${limit}&access_token=${tok.token}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('graph ' + r.status + ' ' + (await r.text()).slice(0, 140));
    const j = await r.json();

    const posts = (j.data || [])
      .filter(m => m.media_type !== 'VIDEO' || m.thumbnail_url)   // need something to show
      .map(m => ({
        id: m.id,
        image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
        href: m.permalink,
        caption: (m.caption || '').slice(0, 140),
        video: m.media_type === 'VIDEO',
        album: m.media_type === 'CAROUSEL_ALBUM',
        at: m.timestamp
      }));

    writeJSON(FEED_FILE, { at: Date.now(), posts });
    res.json({ posts, cached: false });
  } catch (e) {
    console.warn('[instagram] fetch failed:', e.message);
    // serve whatever we last had rather than blanking the section
    if (cached) return res.json({ posts: cached.posts, cached: true, stale: true });
    res.json({ posts: [], error: 'Instagram feed unavailable.' });
  }
});

module.exports = router;
