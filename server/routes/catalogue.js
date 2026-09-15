/* ============================================================
   Catalogue — the downloadable brochure behind the sticky tab, and the
   shareable link that opens it on the site.
   Accepts a PDF or a JPG/PNG.

   GET    /api/catalogue        public  -> { configured, url, name, type, size, cover, updatedAt }
   GET    /api/catalogue/stats  admin   -> how often the share link has been opened
   POST   /api/catalogue        admin   -> replaces the current catalogue
   DELETE /api/catalogue        admin   -> removes it (the sticky tab disappears)

   The share link itself lives in app.js:
     /catalogue      the branded page  (catalogue.html)
     /catalogue.pdf  the file, always the current upload

   Only one catalogue exists at a time; uploading a new one replaces the old
   file on disk, so stale 40MB PDFs don't pile up in uploads/.

   COVER — a JPG of page 1, written to uploads/catalogue-cover.jpg. It is the
   picture WhatsApp, LinkedIn and email clients show when the link is shared,
   which is most of what decides whether anyone taps it. Needs pdftoppm
   (poppler) on the host; without it the link still works, just without a
   preview image.
   ============================================================ */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execFile } = require('child_process');
const multer = require('multer');
const sharp = require('sharp');
const { requireAdmin } = require('../auth');

const { UPLOADS, BUNDLED_UPLOADS, CACHE, BUNDLED_CACHE, TMP, ensureDirs } = require('../paths');

const router = express.Router();
const META = path.join(CACHE, 'catalogue.json');
/* the catalogue that shipped with the deployment. On a read-only serverless host
   CACHE points at /tmp, so the record of an already-uploaded catalogue has to be
   read from the bundle instead — otherwise the sticky tab vanishes on Vercel. */
const BUNDLED_META = path.join(BUNDLED_CACHE, 'catalogue.json');
ensureDirs();

const MAX_MB = 500;

/* Stream to disk, not into memory. At 25MB a memory buffer was fine; at 500MB
   it is not — a couple of concurrent uploads would exhaust the heap and take
   the whole server down with them. */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP),
    filename: (req, file, cb) => cb(null, `up-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`)
  }),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^application\/pdf$/.test(file.mimetype) || /^image\/(jpeg|jpg|png)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF or JPG files are accepted.'));
  }
});

/* Belt and braces: a crash or a killed connection mid-upload can also strand a
   temp file. Anything in tmp/ older than an hour is dead by definition. */
function sweepTmp() {
  try {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const f of fs.readdirSync(TMP)) {
      const p = path.join(TMP, f);
      if (fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p);
    }
  } catch { /* never let housekeeping break an upload */ }
}

function readMeta() {
  for (const f of [META, BUNDLED_META]) {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* try the next */ }
  }
  return null;
}
function writeMeta(m) { fs.writeFileSync(META, JSON.stringify(m, null, 2)); }

/* a catalogue file may live in the writable folder (uploaded at runtime) or in
   the deployment bundle (shipped with the code) — the two are the same directory
   everywhere except on a serverless host */
function locate(url) {
  if (!url) return null;
  for (const dir of [UPLOADS, BUNDLED_UPLOADS]) {
    const f = path.join(dir, path.basename(url));
    try { if (fs.existsSync(f)) return f; } catch { /* try the next */ }
  }
  return null;
}

/* remove the file the previous catalogue pointed at — one catalogue, one file */
function dropOld() {
  const old = readMeta();
  const f = old && locate(old.url);
  if (!f) return;
  try { fs.unlinkSync(f); } catch { /* a locked or read-only file is not worth failing the upload over */ }
}

/* ---- cover image ----
   pdftoppm -singlefile writes exactly <prefix>.jpg, so the name is stable and
   a re-upload simply overwrites it. Resolves to the public URL, or null when
   the tool is missing or the PDF cannot be rasterised — never rejects. */
const COVER_NAME = 'catalogue-cover.jpg';
function makeCover(pdfPath) {
  return new Promise(resolve => {
    const prefix = path.join(UPLOADS, 'catalogue-cover');
    /* 1200px on the long side at q80 lands well under the ~300 KB above which
       WhatsApp silently drops the preview picture */
    execFile('pdftoppm', ['-jpeg', '-jpegopt', 'quality=80', '-scale-to', '1200', '-f', '1', '-l', '1', '-singlefile', pdfPath, prefix],
      { timeout: 60000 }, err => {
        if (err) return resolve(null);
        resolve(fs.existsSync(path.join(UPLOADS, COVER_NAME)) ? `/uploads/${COVER_NAME}` : null);
      });
  });
}
function dropCover() {
  try { fs.unlinkSync(path.join(UPLOADS, COVER_NAME)); } catch { /* nothing to drop */ }
}

/* A catalogue uploaded before covers existed has none on record. Generate it
   the first time anyone asks, once per process, so the share preview appears
   without anyone re-uploading. */
let coverJob = null;
function ensureCover(m) {
  if (m.cover || m.type !== 'pdf') return Promise.resolve(m);
  if (!coverJob) {
    const url = m.url;
    coverJob = makeCover(locate(url)).then(async cover => {
      /* The record may have changed while pdftoppm ran — an upload or a
         delete in that window must win. Only annotate the upload this job
         was started for; never write the snapshot we started with. */
      const cur = readMeta();
      if (!cur || !cur.url) return cur || {};
      if (cur.url !== url) {
        /* a newer file landed mid-job and the old page may have overwritten
           its cover a moment ago — rasterise the current file again */
        if (cur.type === 'pdf') {
          const again = await makeCover(locate(cur.url));
          if (again) { cur.cover = again; try { writeMeta(cur); } catch { /* best effort */ } }
        }
        return cur;
      }
      if (cover) { cur.cover = cover; try { writeMeta(cur); } catch { /* best effort */ } }
      return cur;
    });
  }
  return coverJob;
}

/* ---- share-link opens ----
   A flat JSON counter: total, by kind (page / file), and per day for 90 days.
   Link previewers and crawlers fetch the page too, and they are not clients,
   so recognisable ones are left out. A read-modify-write on a file can drop a
   hit under two simultaneous opens; for a rough measure of whether the link
   is being used that is acceptable. Counting must never break a page. */
const STATS = path.join(CACHE, 'catalogue-views.json');
const NOT_A_PERSON = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|skypeuripreview|discordbot|slackbot|embedly|pinterest|preview|headless|curl|wget|python-requests/i;
function readStats() {
  try { return JSON.parse(fs.readFileSync(STATS, 'utf8')); } catch { return { total: 0, page: 0, file: 0, days: {} }; }
}
function recordView(req, kind) {
  try {
    if (req.method !== 'GET') return;                                   /* HEAD from link checkers is not an open */
    if (NOT_A_PERSON.test(req.get('user-agent') || '')) return;
    const s = readStats();
    const day = new Date().toISOString().slice(0, 10);
    s.total = (s.total || 0) + 1;
    s[kind] = (s[kind] || 0) + 1;
    s.days = s.days || {};
    s.days[day] = (s.days[day] || 0) + 1;
    const keys = Object.keys(s.days).sort();
    while (keys.length > 90) delete s.days[keys.shift()];
    s.lastAt = new Date().toISOString();
    fs.writeFileSync(STATS, JSON.stringify(s));
  } catch { /* never let a counter take a page down */ }
}

router.get('/', async (req, res) => {
  let m = readMeta();
  if (!m || !m.url || !locate(m.url)) return res.json({ configured: false });
  m = await ensureCover(m);
  /* the job hands back whatever the record is NOW, which may be a deletion */
  if (!m || !m.url || !locate(m.url)) return res.json({ configured: false });
  res.json(Object.assign({ configured: true }, m));
});

router.get('/stats', requireAdmin, (req, res) => res.json(readStats()));

router.post('/', requireAdmin, upload.single('file'), async (req, res) => {
  const tmp = req.file && req.file.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' });
    const isPdf = req.file.mimetype === 'application/pdf';
    const stamp = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const name = `catalogue-${stamp}.${isPdf ? 'pdf' : 'jpg'}`;
    const dest = path.join(UPLOADS, name);

    if (isPdf) {
      /* a PDF ships byte-for-byte — re-encoding it would destroy it.
         Move the temp file rather than read it back into memory. */
      fs.renameSync(tmp, dest);
    } else {
      /* an image catalogue is a poster: compress it like any other upload */
      await sharp(tmp).rotate()
        .resize(2200, 2200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true }).toFile(dest);
      fs.unlinkSync(tmp);
    }

    dropOld();   /* only after the new file is safely written */

    /* The page's og:image is a fixed address, so the cover must always live at
       that one name: a PDF gets page 1 rasterised there, an image catalogue is
       resized there. If neither can be produced, the previous catalogue's
       cover must not be left behind masquerading as this one's. */
    let cover = null;
    if (isPdf) cover = await makeCover(dest);
    else {
      try {
        await sharp(dest).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(UPLOADS, COVER_NAME));
        cover = `/uploads/${COVER_NAME}`;
      } catch { cover = null; }
    }
    if (!cover) dropCover();
    coverJob = null;

    const meta = {
      url: `/uploads/${name}`,
      name: req.file.originalname,
      type: isPdf ? 'pdf' : 'image',
      size: fs.statSync(dest).size,
      cover,
      updatedAt: new Date().toISOString()
    };
    writeMeta(meta);
    res.status(201).json(Object.assign({ ok: true }, meta));
  } catch (e) {
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  } finally {
    /* a rejected or failed upload must not leave a 500MB temp file behind */
    try { if (tmp && fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
});

router.delete('/', requireAdmin, (req, res) => {
  dropOld();
  dropCover();
  coverJob = null;
  /* an empty record, not a deleted file: deleting the record would let a
     catalogue that shipped inside the deployment bundle come back from the dead */
  try { writeMeta({}); } catch { /* ignore */ }
  res.json({ ok: true });
});

router.use((err, req, res, next) => {
  /* multer aborts the request before the route handler runs, so its `finally`
     never fires — an over-size upload was leaving its half-written 500MB temp
     file on disk. Clean it up here, where the failure actually lands. */
  if (req.file && req.file.path) {
    try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch { /* ignore */ }
  }
  sweepTmp();

  const msg = err && err.code === 'LIMIT_FILE_SIZE'
    ? `File is too large. Maximum ${MAX_MB} MB.`
    : (err.message || 'Upload error.');
  res.status(400).json({ error: msg });
});

module.exports = router;
/* used by app.js for the share link routes */
module.exports.readMeta = readMeta;
module.exports.locate = locate;
module.exports.recordView = recordView;
