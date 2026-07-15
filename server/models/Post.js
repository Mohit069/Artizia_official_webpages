/* ============================================================
   Posts — blog articles.

   `body` is rich-text HTML produced by the admin editor. It is sanitised
   HERE, on the way in, not on the way out: the public page injects it with
   innerHTML, so anything that reaches the database is already trusted.
   A pasted <script>, an onerror= attribute or a javascript: href would
   otherwise run on every visitor's browser.
   ============================================================ */
const { db } = require('../db/connection');

const safeJSON = s => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } };

/* ---------- sanitiser ---------- */
const ALLOWED = {
  p: [], br: [], strong: [], b: [], em: [], i: [], u: [], s: [],
  h2: [], h3: [], h4: [], blockquote: [], hr: [],
  ul: [], ol: [], li: [],
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'loading'],
  figure: [], figcaption: [], code: [], pre: [], span: []
};

function sanitize(html) {
  let s = String(html || '');

  /* kill whole dangerous elements, contents included */
  s = s.replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)\b[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)\b[^>]*\/?>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');

  /* walk every remaining tag: drop the ones not on the allow-list, and strip
     any attribute that is not explicitly permitted for that tag */
  s = s.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)\/?>/g, (m, close, tagRaw, attrs) => {
    const tag = tagRaw.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(ALLOWED, tag)) return '';
    if (close) return `</${tag}>`;

    const ok = ALLOWED[tag];
    const kept = [];
    const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let a;
    while ((a = re.exec(attrs || ''))) {
      const name = a[1].toLowerCase();
      let val = a[3] != null ? a[3] : (a[4] != null ? a[4] : a[5] || '');
      if (!ok.includes(name)) continue;                      // includes every on* handler
      if ((name === 'href' || name === 'src') && /^\s*(javascript|data|vbscript):/i.test(val)) continue;
      val = val.replace(/"/g, '&quot;');
      kept.push(`${name}="${val}"`);
    }
    /* an external link should not hand the opener window to the destination */
    if (tag === 'a' && kept.some(k => k.startsWith('target='))) kept.push('rel="noopener noreferrer"');
    return `<${tag}${kept.length ? ' ' + kept.join(' ') : ''}>`;
  });

  return s.trim();
}

function toApi(r) {
  if (!r) return null;
  return {
    id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, cover: r.cover,
    author: r.author, tags: safeJSON(r.tags), body: r.body, status: r.status,
    seoTitle: r.seo_title, seoDesc: r.seo_desc,
    publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at
  };
}

const COLS = ['slug', 'title', 'excerpt', 'cover', 'author', 'tags', 'body', 'status', 'seo_title', 'seo_desc', 'published_at'];

function fromApi(o) {
  const status = o.status === 'published' ? 'published' : 'draft';
  return {
    slug: String(o.slug || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
    title: String(o.title || '').slice(0, 200),
    excerpt: o.excerpt ? String(o.excerpt).slice(0, 400) : null,
    cover: o.cover || null,
    author: o.author ? String(o.author).slice(0, 80) : null,
    tags: JSON.stringify(Array.isArray(o.tags) ? o.tags.slice(0, 12).map(t => String(t).slice(0, 40)) : []),
    body: sanitize(o.body),
    status,
    seo_title: o.seoTitle ? String(o.seoTitle).slice(0, 200) : null,
    seo_desc: o.seoDesc ? String(o.seoDesc).slice(0, 400) : null,
    /* stamp the publish date the first time it actually goes live */
    published_at: status === 'published' ? (o.publishedAt || new Date().toISOString()) : (o.publishedAt || null)
  };
}

const all = () => db.prepare('SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC').all().map(toApi);
const published = (limit) => db.prepare(
  "SELECT * FROM posts WHERE status='published' ORDER BY COALESCE(published_at, created_at) DESC" + (limit ? ' LIMIT ?' : '')
).all(...(limit ? [limit] : [])).map(toApi);
const bySlug = slug => toApi(db.prepare('SELECT * FROM posts WHERE slug = ?').get(slug));
const exists = slug => !!db.prepare('SELECT 1 FROM posts WHERE slug = ?').get(slug);

function create(o) {
  const f = fromApi(o);
  db.prepare(`INSERT INTO posts (${COLS.join(',')}) VALUES (${COLS.map(() => '?').join(',')})`)
    .run(...COLS.map(c => f[c]));
  return bySlug(f.slug);
}

function update(slug, o) {
  const f = fromApi(Object.assign({}, o, { slug }));
  const set = COLS.filter(c => c !== 'slug');
  db.prepare(`UPDATE posts SET ${set.map(c => c + '=?').join(',')}, updated_at = datetime('now') WHERE slug = ?`)
    .run(...set.map(c => f[c]), slug);
  return bySlug(slug);
}

const remove = slug => db.prepare('DELETE FROM posts WHERE slug = ?').run(slug).changes > 0;

module.exports = { all, published, bySlug, exists, create, update, remove, sanitize };
