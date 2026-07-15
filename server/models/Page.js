/* ============================================================
   Pages — block-built pages.
   `sections` is stored as JSON text and always handed back as an array.
   ============================================================ */
const { db } = require('../db/connection');

const RESERVED = ['index', 'about', 'collections', 'product', 'contact', 'faq', 'admin',
  'certifications', 'warranty', 'technical-details', 'care-and-maintenance', 'blog', 'post', 'page'];

const safeJSON = s => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } };

function toApi(r) {
  if (!r) return null;
  return {
    id: r.id, slug: r.slug, title: r.title,
    navLabel: r.nav_label, inNav: !!r.in_nav, status: r.status,
    seoTitle: r.seo_title, seoDesc: r.seo_desc, ogImage: r.og_image,
    sections: safeJSON(r.sections), sort: r.sort,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
}

const COLS = ['slug', 'title', 'nav_label', 'in_nav', 'status', 'seo_title', 'seo_desc', 'og_image', 'sections', 'sort'];

function fromApi(o) {
  return {
    slug: String(o.slug || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
    title: String(o.title || '').slice(0, 200),
    nav_label: o.navLabel ? String(o.navLabel).slice(0, 60) : null,
    in_nav: o.inNav ? 1 : 0,
    status: o.status === 'published' ? 'published' : 'draft',
    seo_title: o.seoTitle ? String(o.seoTitle).slice(0, 200) : null,
    seo_desc: o.seoDesc ? String(o.seoDesc).slice(0, 400) : null,
    og_image: o.ogImage || null,
    sections: JSON.stringify(Array.isArray(o.sections) ? o.sections : []),
    sort: Number.isFinite(+o.sort) ? +o.sort : 0
  };
}

const all = () => db.prepare('SELECT * FROM pages ORDER BY sort, title').all().map(toApi);
const published = () => db.prepare("SELECT * FROM pages WHERE status='published' ORDER BY sort, title").all().map(toApi);
const bySlug = slug => toApi(db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug));
const exists = slug => !!db.prepare('SELECT 1 FROM pages WHERE slug = ?').get(slug);
const isReserved = slug => RESERVED.includes(String(slug || '').toLowerCase());

function create(o) {
  const f = fromApi(o);
  db.prepare(`INSERT INTO pages (${COLS.join(',')}) VALUES (${COLS.map(() => '?').join(',')})`)
    .run(...COLS.map(c => f[c]));
  return bySlug(f.slug);
}

function update(slug, o) {
  const f = fromApi(Object.assign({}, o, { slug }));
  const set = COLS.filter(c => c !== 'slug');
  db.prepare(`UPDATE pages SET ${set.map(c => c + '=?').join(',')}, updated_at = datetime('now') WHERE slug = ?`)
    .run(...set.map(c => f[c]), slug);
  return bySlug(slug);
}

const remove = slug => db.prepare('DELETE FROM pages WHERE slug = ?').run(slug).changes > 0;

module.exports = { all, published, bySlug, exists, isReserved, create, update, remove, RESERVED };
