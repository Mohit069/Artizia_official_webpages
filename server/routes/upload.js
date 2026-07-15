/* ============================================================
   Image upload — admin only.
   multer (memory) -> sharp resize (max 1500px, JPEG q80) -> disk
   Returns { url } pointing at /uploads/<file>.jpg
   ============================================================ */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const { requireAdmin } = require('../auth');

const router = express.Router();
const { UPLOADS, ensureDirs } = require('../paths');
ensureDirs();

const MAX_DIM = parseInt(process.env.UPLOAD_MAX_DIM || '1500', 10);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB raw upload cap
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|jpg|avif|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  }
});

// POST /api/upload   (field name: "image")
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided.' });
    const name = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.jpg`;
    const outPath = path.join(UPLOADS, name);
    await sharp(req.file.buffer)
      .rotate() // respect EXIF orientation
      .resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outPath);
    res.status(201).json({ url: `/uploads/${name}` });
  } catch (e) {
    res.status(500).json({ error: 'Image processing failed: ' + e.message });
  }
});

// multer/other errors -> JSON
router.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload error.' });
});

module.exports = router;
