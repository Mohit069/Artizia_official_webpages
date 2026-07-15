/* ============================================================
   Products REST API
     GET    /api/products            (list, ?collection=Luxury)
     GET    /api/products/:slug      (single)
     POST   /api/products            (create — admin)
     PUT    /api/products/:slug      (update — admin)
     DELETE /api/products/:slug      (delete — admin)
   ============================================================ */
const express = require('express');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { requireAdmin } = require('../auth');

const router = express.Router();
const { UPLOADS } = require('../paths');

/* remove an uploaded file (safely, only inside /uploads) when it is no longer used */
function deleteUpload(url){
  if (!url || !url.startsWith('/uploads/')) return;
  const file = path.join(UPLOADS, path.basename(url));
  if (path.dirname(file) === UPLOADS && fs.existsSync(file)) {
    try { fs.unlinkSync(file); } catch {}
  }
}
function slugify(v){
  return String(v || '').trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

/* ---- public reads ---- */
router.get('/', (req, res) => {
  res.json(Product.all(req.query.collection || null));
});
router.get('/:slug', (req, res) => {
  const p = Product.bySlug(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Product not found.' });
  res.json(p);
});

/* ---- admin writes ---- */
router.post('/', requireAdmin, (req, res) => {
  const body = req.body || {};
  const slug = slugify(body.slug || body.name);
  if (!slug) return res.status(400).json({ error: 'A slug or name is required.' });
  if (!body.name) return res.status(400).json({ error: 'Name is required.' });
  if (Product.exists(slug)) return res.status(409).json({ error: 'That slug already exists.' });
  const created = Product.create(Object.assign({}, body, { slug }));
  res.status(201).json(created);
});

router.put('/:slug', requireAdmin, (req, res) => {
  const slug = req.params.slug;
  const existing = Product.bySlug(slug);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });
  const body = req.body || {};
  // delete image files that were removed/replaced
  const oldImgs = existing.images || [];
  const newImgs = body.images || [];
  oldImgs.forEach((u, i) => { if (u && u !== newImgs[i]) deleteUpload(u); });
  const updated = Product.update(slug, body);
  res.json(updated);
});

router.delete('/:slug', requireAdmin, (req, res) => {
  const existing = Product.bySlug(req.params.slug);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });
  (existing.images || []).forEach(deleteUpload);
  Product.remove(req.params.slug);
  res.json({ ok: true, deleted: req.params.slug });
});

module.exports = router;
