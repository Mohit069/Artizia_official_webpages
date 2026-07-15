/* ============================================================
   Catalogue — the downloadable brochure behind the sticky tab.
   Accepts a PDF or a JPG/PNG.

   GET    /api/catalogue        public  -> { configured, url, name, type, size, updatedAt }
   POST   /api/catalogue        admin   -> replaces the current catalogue
   DELETE /api/catalogue        admin   -> removes it (the sticky tab disappears)

   Only one catalogue exists at a time; uploading a new one replaces the old
   file on disk, so stale 40MB PDFs don't pile up in uploads/.
   ============================================================ */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
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

router.get('/', (req, res) => {
  const m = readMeta();
  if (!m || !m.url || !locate(m.url)) return res.json({ configured: false });
  res.json(Object.assign({ configured: true }, m));
});

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

    const meta = {
      url: `/uploads/${name}`,
      name: req.file.originalname,
      type: isPdf ? 'pdf' : 'image',
      size: fs.statSync(dest).size,
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
