/* ============================================================
   Pages + Blog posts API.

   PUBLIC  GET /api/pages            -> published pages (for the nav)
           GET /api/pages/:slug      -> one published page
           GET /api/posts            -> published posts  (?limit=n)
           GET /api/posts/:slug      -> one published post

   ADMIN   GET    /api/pages/admin/all   POST /api/pages
           PUT    /api/pages/:slug       DELETE /api/pages/:slug
           …same shape for /api/posts
   Drafts are only ever visible to a signed-in admin.
   ============================================================ */
const express = require('express');
const Page = require('../models/Page');
const Post = require('../models/Post');
const { requireAdmin } = require('../auth');

const router = express.Router();

const bad = (res, msg) => res.status(400).json({ error: msg });

function checkSlug(slug) {
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) return 'Slug must be lowercase letters, numbers and dashes.';
  return null;
}

/* ═══════════════════ PAGES ═══════════════════ */

/* admin list must be declared before /:slug or "admin" is read as a slug */
router.get('/pages/admin/all', requireAdmin, (req, res) => res.json(Page.all()));

router.get('/pages', (req, res) => {
  /* the nav only needs the light fields */
  res.json(Page.published().map(p => ({ slug: p.slug, title: p.title, navLabel: p.navLabel, inNav: p.inNav })));
});

router.get('/pages/:slug', (req, res) => {
  const p = Page.bySlug(req.params.slug);
  if (!p || p.status !== 'published') return res.status(404).json({ error: 'Page not found.' });
  res.json(p);
});

router.post('/pages', requireAdmin, (req, res) => {
  const b = req.body || {};
  const slug = String(b.slug || '').toLowerCase().trim();
  const err = checkSlug(slug);
  if (err) return bad(res, err);
  if (!b.title) return bad(res, 'A page needs a title.');
  /* a page called "about" would shadow the real about.html forever */
  if (Page.isReserved(slug)) return bad(res, `“${slug}” is the address of an existing page. Choose another.`);
  if (Page.exists(slug)) return res.status(409).json({ error: 'A page with that address already exists.' });
  res.status(201).json(Page.create(b));
});

router.put('/pages/:slug', requireAdmin, (req, res) => {
  if (!Page.exists(req.params.slug)) return res.status(404).json({ error: 'Page not found.' });
  if (!req.body || !req.body.title) return bad(res, 'A page needs a title.');
  res.json(Page.update(req.params.slug, req.body));
});

router.delete('/pages/:slug', requireAdmin, (req, res) => {
  if (!Page.remove(req.params.slug)) return res.status(404).json({ error: 'Page not found.' });
  res.json({ ok: true });
});

/* ═══════════════════ POSTS ═══════════════════ */

router.get('/posts/admin/all', requireAdmin, (req, res) => res.json(Post.all()));

router.get('/posts', (req, res) => {
  const n = Math.min(parseInt(req.query.limit, 10) || 0, 50);
  res.json(Post.published(n || undefined));
});

router.get('/posts/:slug', (req, res) => {
  const p = Post.bySlug(req.params.slug);
  if (!p || p.status !== 'published') return res.status(404).json({ error: 'Article not found.' });
  res.json(p);
});

router.post('/posts', requireAdmin, (req, res) => {
  const b = req.body || {};
  const slug = String(b.slug || '').toLowerCase().trim();
  const err = checkSlug(slug);
  if (err) return bad(res, err);
  if (!b.title) return bad(res, 'An article needs a title.');
  if (Post.exists(slug)) return res.status(409).json({ error: 'An article with that address already exists.' });
  res.status(201).json(Post.create(b));
});

router.put('/posts/:slug', requireAdmin, (req, res) => {
  if (!Post.exists(req.params.slug)) return res.status(404).json({ error: 'Article not found.' });
  if (!req.body || !req.body.title) return bad(res, 'An article needs a title.');
  res.json(Post.update(req.params.slug, req.body));
});

router.delete('/posts/:slug', requireAdmin, (req, res) => {
  if (!Post.remove(req.params.slug)) return res.status(404).json({ error: 'Article not found.' });
  res.json({ ok: true });
});

module.exports = router;
