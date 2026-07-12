/* ============================================================
   ARTIZIA — Express server
   Serves the static site + the /api backend + /uploads images.
   ============================================================ */
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { db, ping, DB_PATH } = require('./db/connection');
const { ensureSchema, seedIfEmpty } = require('./db/init');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');            // project root (static HTML/CSS/JS)
const UPLOADS = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

/* ensure schema exists + seed defaults on first run */
ensureSchema();
const seedResult = seedIfEmpty();

app.use(express.json({ limit: '4mb' }));

/* uploaded images, served efficiently with caching */
app.use('/uploads', express.static(UPLOADS, { maxAge: '30d' }));

/* health check — confirms server is up and DB is connected */
app.get('/api/health', (req, res) => {
  try {
    res.json({ ok: true, db: 'connected', sqlite: ping(), products: Product.count(), dbPath: DB_PATH, time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* API routes */
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/upload',    require('./routes/upload'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/instagram', require('./routes/instagram'));

/* static site (index.html, collections.html, assets/, …)
   HTML/CSS/JS must revalidate — a stale stylesheet against fresh markup renders a broken page.
   Images and fonts are content-addressed by name, so they can cache hard. */
app.use(express.static(ROOT, {
  extensions: ['html'],
  etag: true,
  setHeaders(res, filePath) {
    if (/\.(html|css|js)$/i.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
    else if (/\.(png|jpe?g|webp|avif|gif|svg|mp4|webm|woff2?)$/i.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=604800');
  }
}));

app.listen(PORT, () => {
  console.log(`\n  ARTIZIA server running`);
  console.log(`  → Site:   http://localhost:${PORT}/`);
  console.log(`  → Health: http://localhost:${PORT}/api/health`);
  console.log(`  → DB:     ${DB_PATH} (SQLite ${ping()})`);
  console.log(`  → Data:   ${Product.count()} products` + (seedResult.skipped ? ' (existing data preserved)' : ` (seeded ${seedResult.seeded} defaults)`) + `\n`);
});
