/* ============================================================
   Page content — inline edits to the hand-built marketing pages.

   One row per page. `data` is a JSON map of { fieldKey: value }:
     "hero.title"        -> "Crafting Timeless <em>Luxury…</em>"
     "hero.image"        -> "/uploads/1784-abcd.jpg"
     "hero.image__alt"   -> "Raw quartz crystal on black"

   Text values are sanitised to a small inline-formatting allow-list so an
   edit can carry an <em> accent or a link, but never a <script> — the public
   page injects them with innerHTML.
   ============================================================ */
const { db } = require('../db/connection');

/* inline formatting only — these edits live inside existing headings and
   paragraphs, so block tags (p, h2, div…) are neither needed nor wanted */
const INLINE_OK = { strong: [], b: [], em: [], i: [], u: [], s: [], br: [], span: [],
  a: ['href', 'title', 'target', 'rel'] };

function sanitizeValue(v) {
  let s = String(v == null ? '' : v);
  /* a plain URL or alt string has no tags and passes straight through */
  s = s.replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)\b[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)\b[^>]*\/?>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)\/?>/g, (m, close, tagRaw, attrs) => {
    const tag = tagRaw.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(INLINE_OK, tag)) return '';
    if (close) return `</${tag}>`;
    const ok = INLINE_OK[tag], kept = [];
    const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let a;
    while ((a = re.exec(attrs || ''))) {
      const name = a[1].toLowerCase();
      let val = a[3] != null ? a[3] : (a[4] != null ? a[4] : a[5] || '');
      if (!ok.includes(name)) continue;
      if (name === 'href' && /^\s*(javascript|data|vbscript):/i.test(val)) continue;
      kept.push(`${name}="${val.replace(/"/g, '&quot;')}"`);
    }
    if (tag === 'a' && kept.some(k => k.startsWith('target='))) kept.push('rel="noopener noreferrer"');
    return `<${tag}${kept.length ? ' ' + kept.join(' ') : ''}>`;
  });
  return s.slice(0, 8000).trim();
}

const safeMap = s => { try { const v = JSON.parse(s); return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; } catch { return {}; } };

function get(page) {
  const r = db.prepare('SELECT data FROM page_content WHERE page = ?').get(String(page));
  return r ? safeMap(r.data) : {};
}

/* merge a patch into the stored map. A value of null/'' deletes the key, so an
   admin can revert a field to the page's built-in default. */
function setMany(page, patch) {
  const cur = get(page);
  for (const [k, v] of Object.entries(patch || {})) {
    const key = String(k).slice(0, 120);
    if (v == null || v === '') delete cur[key];
    else cur[key] = sanitizeValue(v);
  }
  const json = JSON.stringify(cur);
  db.prepare(`INSERT INTO page_content (page, data, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(page) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`)
    .run(String(page), json);
  return cur;
}

module.exports = { get, setMany, sanitizeValue };
