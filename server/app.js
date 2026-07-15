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
