/* ============================================================
   WHERE THE APP IS ALLOWED TO WRITE
   ------------------------------------------------------------
   On a normal server (your own host, Render, a VPS) everything lives
   next to the code and persists: server/db/artizia.db, server/uploads/,
   server/cache/.

   On a serverless host (Vercel) the deployed bundle is READ-ONLY. The
   only writable directory is /tmp, and it is wiped whenever the container
   is recycled — which happens after a few minutes of inactivity.

   So on Vercel we copy the bundled database into /tmp on cold start and
   point every write there. The site works, the admin panel works, but
   ANY CHANGE MADE THROUGH THE ADMIN PANEL IS LOST when the container
   recycles — including contact enquiries. That is acceptable for a
   preview URL and unacceptable for the live site. See VERCEL.md.

   Nothing here changes local behaviour: without process.env.VERCEL,
   every path is exactly what it was before.
   ============================================================ */
const path = require('path');
const fs = require('fs');
const os = require('os');

const SERVERLESS = !!process.env.VERCEL;

const SERVER_DIR = __dirname;
const WRITE_ROOT = SERVERLESS ? path.join(os.tmpdir(), 'artizia') : SERVER_DIR;

/* the database that ships inside the deployment (read-only on Vercel) */
const BUNDLED_DB = process.env.DB_PATH || path.join(SERVER_DIR, 'db', 'artizia.db');
/* the one SQLite actually opens — it must be able to write its journal */
const DB_PATH = SERVERLESS ? path.join(WRITE_ROOT, 'artizia.db') : BUNDLED_DB;

/* images that shipped with the deployment vs. ones uploaded at runtime.
   On Vercel the bundled ones are served straight from the CDN (see
   vercel.json); only newly uploaded ones come out of the function. */
const BUNDLED_UPLOADS = path.join(SERVER_DIR, 'uploads');
const UPLOADS = SERVERLESS ? path.join(WRITE_ROOT, 'uploads') : BUNDLED_UPLOADS;

const BUNDLED_CACHE = path.join(SERVER_DIR, 'cache');
const CACHE = SERVERLESS ? path.join(WRITE_ROOT, 'cache') : BUNDLED_CACHE;
const TMP = path.join(CACHE, 'tmp');

function ensureDirs() {
  for (const d of [WRITE_ROOT, UPLOADS, CACHE, TMP]) {
    try { fs.mkdirSync(d, { recursive: true }); } catch { /* read-only fs: caller copes */ }
  }
}

/* Cold start on Vercel: lay the shipped database down in /tmp so it can be
   opened read-write. Cheap — the file is ~120KB — and only happens once per
   container. */
function ensureDb() {
  if (!SERVERLESS) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    return;
  }
  ensureDirs();
  if (!fs.existsSync(DB_PATH) && fs.existsSync(BUNDLED_DB)) {
    fs.copyFileSync(BUNDLED_DB, DB_PATH);
  }
}

module.exports = {
  SERVERLESS, DB_PATH, BUNDLED_DB,
  UPLOADS, BUNDLED_UPLOADS,
  CACHE, BUNDLED_CACHE, TMP,
  ensureDirs, ensureDb
};
