/* ============================================================
   ARTIZIA — the Express app itself.
   Kept separate from server.js so it can be either listened on
   (a normal server) or exported as a handler (serverless).
   ============================================================ */
require('dotenv').config();
const express = require('express');
const path = require('path');
const { db, ping, DB_PATH } = require('./db/connection');
const { ensureSchema, seedIfEmpty } = require('./db/init');
const Product = require('./models/Product');
const { UPLOADS, BUNDLED_UPLOADS, SERVERLESS, ensureDirs } = require('./paths');

const app = express();
const ROOT = path.join(__dirname, '..');            // project root (static HTML/CSS/JS)

ensureDirs();

/* schema + defaults. On a serverless host this runs against the copy of the
   database in /tmp, once per cold start. */
ensureSchema();
const seedResult = seedIfEmpty();
require('./models/User').seedIfEmpty();

app.use(express.json({ limit: '4mb' }));

/* uploaded images, served efficiently with caching.
   Two directories on a serverless host: images that shipped with the deployment
   are normally served straight off the CDN, but anything uploaded at runtime
   only exists in /tmp and has to come through here. */
/* Every upload gets a unique timestamped name, so 30 days is safe — except the
   catalogue cover, which is overwritten IN PLACE on each re-upload and is the
   picture behind the share link's preview. Five minutes for that one. `send`
   only sets Cache-Control when none is present, so this wins. */
app.get('/uploads/catalogue-cover.jpg', (req, res, next) => { res.setHeader('Cache-Control', 'public, max-age=300'); next(); });
app.use('/uploads', express.static(UPLOADS, { maxAge: '30d' }));
if (SERVERLESS) app.use('/uploads', express.static(BUNDLED_UPLOADS, { maxAge: '30d' }));

/* health check — confirms server is up and DB is connected */
app.get('/api/health', (req, res) => {
  try {
    res.json({
      ok: true, db: 'connected', sqlite: ping(), products: Product.count(),
      dbPath: DB_PATH, serverless: SERVERLESS, time: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* API routes */
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/upload',    require('./routes/upload'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/instagram', require('./routes/instagram'));
app.use('/api/catalogue', require('./routes/catalogue'));
app.use('/api',           require('./routes/content'));   /* /api/pages, /api/posts */

/* ---- the shareable catalogue link ----
   /catalogue      the branded page (catalogue.html, or the SPA route) — the
                   URL to put in front of clients. Counted, then handed on to
                   whichever static handler serves the page.
   /catalogue.pdf  the file itself. Uploads get a new timestamped name every
                   time, so this stable address always redirects to the
                   current one — a link sent last month keeps working after a
                   re-upload. */
const catalogue = require('./routes/catalogue');
app.get(['/catalogue', '/catalogue.html'], (req, res, next) => { catalogue.recordView(req, 'page'); next(); });
app.get('/catalogue.pdf', (req, res) => {
  const m = catalogue.readMeta();
  if (!m || !m.url || !catalogue.locate(m.url)) return res.status(404).type('text').send('No catalogue has been uploaded yet.');
  catalogue.recordView(req, 'file');
  res.redirect(302, m.url);
});

/* ---- OPTIONAL: serve the React (Vite) build ----
   Set SERVE_SPA=1 to serve frontend/dist instead of the legacy static HTML.
   Additive and off by default: without the env var, behaviour is exactly what
   it was before. Used when deploying the React app on a Node host (VPS). */
if (process.env.SERVE_SPA === '1') {
  const DIST = process.env.SPA_DIR || path.join(ROOT, 'frontend', 'dist');
  app.use(express.static(DIST, {
    extensions: ['html'],
    etag: true,
    setHeaders(res, filePath) {
      if (/\.html$/i.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
      else res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
  /* React Router fallback — any non-API, non-upload path renders the SPA shell */
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (/^\/(api|uploads)\//.test(req.path)) return next();
    res.sendFile(path.join(DIST, 'index.html'), err => err && next());
  });
  module.exports = app;
  module.exports.seedResult = seedResult;
  return;
}

/* ---- pretty URLs for CMS content ----
   /p/<slug>     -> page.html   (a page built in the admin panel)
   /blog         -> blog.html
   /blog/<slug>  -> post.html
   The templates fetch their own data from the API using the slug in the path,
   so one file serves every page. Declared BEFORE express.static so a stray
   file named p/ or blog/ can never shadow them.
   (On Vercel these are handled by rewrites in vercel.json instead — the
   function never sees them.) */
app.get('/p/:slug',    (req, res) => res.sendFile(path.join(ROOT, 'page.html')));
app.get('/blog',       (req, res) => res.sendFile(path.join(ROOT, 'blog.html')));
app.get('/blog/:slug', (req, res) => res.sendFile(path.join(ROOT, 'post.html')));

/* static site (index.html, collections.html, assets/, …)
   HTML/CSS/JS must revalidate — a stale stylesheet against fresh markup renders a broken page.
   Images and fonts are content-addressed by name, so they can cache hard.
   On Vercel the CDN serves all of this and the function is never reached. */
app.use(express.static(ROOT, {
  extensions: ['html'],
  etag: true,
  setHeaders(res, filePath) {
    if (/\.(html|css|js)$/i.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
    else if (/\.(png|jpe?g|webp|avif|gif|svg|mp4|webm|woff2?)$/i.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=604800');
  }
}));

module.exports = app;
module.exports.seedResult = seedResult;
