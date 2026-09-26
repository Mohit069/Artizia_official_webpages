/* ============================================================
   SEO — what crawlers get that browsers don't need.

   robots.txt and sitemap.xml are generated from the database, so a product
   added in the admin panel is in the sitemap the moment it is saved.

   product.html and collections.html are one template each, filled in by the
   browser from the API. A crawler that reads the raw file sees the same
   title, description and (no) structured data on every product. The handlers
   here fill the <head> on the server for the product actually requested:
   title, description, canonical, share tags and JSON-LD (schema.org), so the
   page is complete before any JavaScript runs.

   Structured data shipped:
     every page      Organization (#organization) + WebSite (#website)
     product page    Product + BreadcrumbList
     collections     CollectionPage + ItemList of the products shown

   No Offer / price is declared: quotes are per project, and Google refuses a
   Product rich result without a price, rating or review, so none is claimed.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');
const Post = require('./models/Post');
const Page = require('./models/Page');

const SITE_URL = (process.env.SITE_URL || 'https://artizia.co.in').replace(/\/$/, '');
const ROOT = path.join(__dirname, '..');
const abs = (u) => (!u ? '' : /^https?:\/\//i.test(u) ? u : SITE_URL + (u.startsWith('/') ? u : '/' + u));
const LOGO = abs('/assets/img/brand/logo-full.png');
/* 1200x630, what a page without a picture of its own shows when shared */
const SHARE_IMAGE = abs('/assets/img/og-home.jpg');

/* ---- the company, referenced by @id from every page ---- */
const ORG = {
  '@type': 'Organization',
  '@id': SITE_URL + '/#organization',
  name: 'Artizia',
  alternateName: 'Artizia by Marudhar',
  url: SITE_URL + '/',
  logo: { '@type': 'ImageObject', url: LOGO },
  image: LOGO,
  description: 'Quartz slab manufacturer, exporter and supplier of jumbo quartz slabs and luxury engineered quartz surfaces for kitchen countertops, bathroom vanities, table tops and commercial projects — pressed on Breton Stone technology in Jaipur, India.',
  telephone: '+91 89528 15800',
  email: 'sales@artizia.co.in',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Plot No. PA-008-020-023, Mahindra World City Jaipur, Bhambhoriya Sanganer',
    addressLocality: 'Jaipur',
    addressRegion: 'Rajasthan',
    postalCode: '302037',
    addressCountry: 'IN'
  },
  contactPoint: [
    { '@type': 'ContactPoint', contactType: 'sales', telephone: '+91 89528 15800', email: 'sales@artizia.co.in', availableLanguage: ['en', 'hi'] },
    { '@type': 'ContactPoint', contactType: 'sales', telephone: '+91 92160 57565', url: 'https://wa.me/919216057565', name: 'WhatsApp', availableLanguage: ['en', 'hi'] }
  ],
  parentOrganization: { '@type': 'Organization', name: 'Marudhar Group' },
  sameAs: [
    'https://www.instagram.com/artizia_by_marudhar/',
    'https://www.linkedin.com/company/artizia-by-marudhar/'
  ]
};
const WEBSITE = {
  '@type': 'WebSite',
  '@id': SITE_URL + '/#website',
  url: SITE_URL + '/',
  name: 'Artizia',
  publisher: { '@id': SITE_URL + '/#organization' },
  inLanguage: 'en'
};
const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': [ORG, WEBSITE, ...nodes] });

const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(url) }))
});

/* ---- head injection ----
   Works on the template's own tags so the file stays a valid page when
   served as-is (Vercel, a plain file server). */
const escAttr = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* a "</script>" inside a JSON string would end the block early */
const jsonForScript = (o) => JSON.stringify(o).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');

function inject(html, h) {
  let out = html;
  if (h.title) out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escText(h.title)}</title>`);
  if (h.description) out = out.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escAttr(h.description)}">`);
  if (h.canonical) {
    const tag = `<link rel="canonical" href="${escAttr(h.canonical)}">`;
    out = /<link rel="canonical"[^>]*>/i.test(out) ? out.replace(/<link rel="canonical"[^>]*>/i, tag) : out.replace(/<\/title>/i, `</title>\n${tag}`);
  }
  const extra = [];
  /* og:* is a property, everything else (twitter:*) a name */
  for (const [p, c] of h.og || []) if (c) extra.push(`<meta ${/^og:/i.test(p) ? 'property' : 'name'}="${escAttr(p)}" content="${escAttr(c)}">`);
  if (h.jsonLd) extra.push(`<script type="application/ld+json">${jsonForScript(h.jsonLd)}</script>`);
  if (extra.length) out = out.replace(/<\/head>/i, `${extra.join('\n')}\n</head>`);
  return out;
}

/* ---- body injection ----
   The pages are filled in by the browser, so the raw HTML has an empty <h1> and
   no copy. What a crawler needs is written into the very elements the page's own
   script overwrites a moment later with the same text: the heading, the
   description, the specifications. A browser ends up exactly where it always
   did; a reader that runs no JavaScript now gets a real page.

   Nothing filled here carries the .rv reveal class, so there is no flash — the
   text is simply on screen sooner than the API could deliver it. */
const fillEl = (html, id, inner) =>
  html.replace(new RegExp(`(<([a-z0-9]+)\\b[^>]*\\bid="${id}"[^>]*>)\\s*</\\2>`, 'i'),
    (m, open, tag) => open + inner + '</' + tag + '>');

/* the heading a marketing page will render, read out of its own
   window.PAGE.banner so the wording still lives in one place — the page */
function bannerText(html) {
  const block = /banner:\s*\{([\s\S]*?)\n\s*\}/.exec(html) || /hero:\s*\{([\s\S]*?)\n\s*\}/.exec(html);
  if (!block) return {};
  const get = (k) => {
    const m = new RegExp(k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"').exec(block[1]);
    return m ? m[1].replace(/\\"/g, '"') : '';
  };
  return { eyebrow: get('eyebrow'), title: get('title'), lead: get('lead') };
}

/* about.html raises its headline a word at a time. The same wrapping is applied
   here so the heading the server writes is the markup the browser would write —
   otherwise the animation would replay from plain text. */
const wordWrap = (t) => {
  let i = 0;
  return String(t).replace(/(<br\s*\/?>)|(<em>.*?<\/em>|[^\s<]+)/g, (m, br) => br || `<span class="w" style="--i:${i++}">${m}</span>`);
};

/* fills the hero's empty eyebrow / h1 / lead. about.html names them by id;
   the rest carry classes inside .page-hero, and that lookup is scoped to the
   one section so the eyebrows further down the page are left alone. The title
   and lead hold markup (<em>, <br>) and come from our own file, so they go in
   as written. */
function bannerFill(html) {
  const b = bannerText(html);
  if (!b.title && !b.eyebrow && !b.lead) return html;
  let out = html;
  if (b.eyebrow) out = fillEl(out, 'hEye', escText(b.eyebrow));
  if (b.lead)    out = fillEl(out, 'hLead', escText(b.lead));
  if (b.title)   out = fillEl(out, 'hTitle', wordWrap(b.title));
  const start = out.search(/<section[^>]*class="[^"]*\bpage-hero\b[^"]*"/i);
  if (start < 0) return out;
  const end = out.indexOf('</section>', start);
  if (end < 0) return out;
  let s = out.slice(start, end);
  if (b.eyebrow) s = s.replace(/(<span class="eyebrow"[^>]*>)\s*(<\/span>)/i, (m, o, c) => o + escText(b.eyebrow) + c);
  if (b.title)   s = s.replace(/(<h1[^>]*>)\s*(<\/h1>)/i, (m, o, c) => o + b.title + c);
  if (b.lead)    s = s.replace(/(<p class="lead"[^>]*>)\s*(<\/p>)/i, (m, o, c) => o + b.lead + c);
  return out.slice(0, start) + s + out.slice(end);
}

/* Share tags, taken from the page's own title, description and canonical.
   Added only where the page names no picture of its own, so catalogue.html keeps
   its cover and the product pages keep their slab. */
function shareTags(html) {
  if (/property="og:image"/i.test(html)) return html;
  const grab = (re) => { const m = re.exec(html); return m ? m[1].replace(/\s+/g, ' ').trim() : ''; };
  const url = grab(/<link rel="canonical" href="([^"]+)"/i);
  const og = [
    ['og:type', 'website'], ['og:site_name', 'Artizia'], ['og:url', url],
    ['og:title', grab(/<title>([^<]*)<\/title>/i)],
    ['og:description', grab(/<meta name="description"\s+content="([^"]*)"/i)],
    ['og:image', SHARE_IMAGE], ['og:image:width', '1200'], ['og:image:height', '630'],
    ['og:image:alt', 'An Artizia engineered quartz slab'],
    ['twitter:card', 'summary_large_image']
  ].filter(([p, c]) => c && !new RegExp(`(property|name)="${p}"`, 'i').test(html));
  return og.length ? inject(html, { og }) : html;
}

/* the template, re-read only when the file changes on disk */
const templates = new Map();
function template(name) {
  const file = path.join(ROOT, name);
  const mtime = fs.statSync(file).mtimeMs;
  const hit = templates.get(name);
  if (hit && hit.mtime === mtime) return hit.html;
  const html = fs.readFileSync(file, 'utf8');
  templates.set(name, { mtime, html });
  return html;
}

const SLAB = '3300 × 1650 mm';

/* ---- addresses ----
   A surface lives at /quartz/<name> and a collection at /collections/<name>.
   The query-string forms these replace (product.html?p=, collections.html?c=)
   redirect here permanently; nothing on the site links to them any more.

   A collection's address is derived from its name, so a collection added in the
   admin panel gets one without anything here being edited. Reading it back means
   asking the catalogue which name produces that address — there is no list of
   collections to keep in step. */
const collSlug = (name) => String(name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function collFromSlug(slug) {
  const want = collSlug(slug);
  if (!want) return null;
  for (const p of Product.all(null)) if (collSlug(p.coll) === want) return p.coll;
  return null;
}
const productPath = (slug) => `/quartz/${encodeURIComponent(slug)}`;
const collectionPath = (coll) => (coll ? `/collections/${collSlug(coll)}` : '/collections');
const productUrl = (slug) => SITE_URL + productPath(slug);
const collectionUrl = (coll) => SITE_URL + collectionPath(coll);

function productNode(m) {
  const images = (m.images || []).filter(Boolean).map(abs);
  const props = [['Vein', m.veinText], ['Grain', m.grain], ['Finish', m.finish], ['Thickness', m.thickness], ['Slab size', SLAB]]
    .filter(([, v]) => v)
    .map(([name, value]) => ({ '@type': 'PropertyValue', name, value }));
  const node = {
    '@type': 'Product',
    '@id': productUrl(m.slug) + '#product',
    name: m.name,
    sku: m.code || undefined,
    description: m.desc || undefined,
    url: productUrl(m.slug),
    brand: { '@type': 'Brand', name: 'Artizia' },
    manufacturer: { '@id': SITE_URL + '/#organization' },
    category: m.coll ? `${m.coll} Collection` : undefined,
    material: 'Engineered quartz',
    additionalProperty: props
  };
  if (images.length) node.image = images;
  if (m.apps && m.apps.length) node.keywords = m.apps.join(', ');
  return node;
}

function productHead(m) {
  const title = `${m.name} — ${m.coll ? m.coll + ' Collection ' : ''}Quartz Slab | Artizia`;
  const specs = [m.veinText, m.grain && m.grain + ' grain', m.finish && m.finish + ' finish', m.thickness].filter(Boolean).join(' · ');
  const description = `${m.desc || ''} ${specs ? specs + '. ' : ''}Jumbo ${SLAB} engineered quartz slabs by Artizia, Jaipur. Free samples across India.`.trim();
  const image = (m.images || []).find(Boolean);
  const url = productUrl(m.slug);
  return {
    title, description, canonical: url,
    og: [
      ['og:type', 'website'], ['og:site_name', 'Artizia'], ['og:url', url],
      ['og:title', `${m.name} — Artizia Quartz`], ['og:description', m.desc || description],
      ['og:image', image ? abs(image) : SHARE_IMAGE],
      ['twitter:card', 'summary_large_image']
    ],
    jsonLd: graph(
      productNode(m),
      crumbs([['Home', '/'], ['Collections', '/collections'], ...(m.coll ? [[m.coll, collectionUrl(m.coll)]] : []), [m.name, url]])
    )
  };
}

/* the product page's heading, breadcrumb and specification panel */
function productBody(html, m) {
  const link = (href, text) => `<a href="${escAttr(href)}">${escText(text)}</a>`;
  const crumb = [
    link('/', 'Home'), '<span>/</span>', link('/collections', 'Collections'),
    ...(m.coll ? ['<span>/</span>', link(collectionPath(m.coll), m.coll)] : []),
    '<span>/</span>', `<b>${escText(m.name)}</b>`
  ].join('');
  const specs = [['Vein', m.veinText || m.vein], ['Grain', m.grain], ['Finish', m.finish], ['Thickness', m.thickness]]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div class="s"><div class="k">${escText(k)}</div><div class="v">${escText(v)}</div></div>`)
    .join('');
  const info = [
    m.code ? `<div class="code">NO. ${escText(m.code)} · QUARTZ SURFACE</div>` : '',
    m.desc ? `<p class="pdesc">${escText(m.desc)}</p>` : '',
    specs ? `<div class="scg">${specs}</div>` : '',
    (m.apps || []).length ? `<div class="pnote">${escText('Applications: ' + m.apps.join(' · '))}</div>` : ''
  ].join('');
  let out = fillEl(html, 'crumb', crumb);
  out = fillEl(out, 'pheye', m.coll ? escText(m.coll + ' Collection') : '');
  out = fillEl(out, 'phtitle', escText(m.name));
  return fillEl(out, 'pinfo', info);
}

function collectionsHead(coll) {
  const all = Product.all(null);
  const list = coll ? all.filter(p => p.coll === coll) : all;
  const url = collectionUrl(coll);
  const title = coll ? `${coll} Collection — Artizia Quartz Surfaces` : 'Collections — Artizia Quartz Surfaces';
  const description = coll
    ? `${list.length} engineered quartz surfaces in the Artizia ${coll} collection. Jumbo ${SLAB} slabs, pressed on Breton Stone technology in Jaipur, India.`
    : `Explore ${all.length} engineered quartz surfaces across five Artizia collections — Signature, Luxury, Premium, Classic and Essentials.`;
  return {
    title, description,
    /* Each collection answers a different search — "luxury quartz slabs" is not
       "quartz slabs" — so each gets a canonical of its own rather than pointing
       at the unfiltered page, which is what kept them out of the index. */
    canonical: url,
    og: [['og:type', 'website'], ['og:site_name', 'Artizia'], ['og:url', url], ['og:title', title], ['og:description', description],
      ['og:image', SHARE_IMAGE], ['og:image:width', '1200'], ['og:image:height', '630'], ['twitter:card', 'summary_large_image']],
    jsonLd: graph(
      {
        '@type': 'CollectionPage',
        '@id': url + '#page',
        url, name: title, description,
        isPartOf: { '@id': SITE_URL + '/#website' },
        about: { '@id': SITE_URL + '/#organization' },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: list.length,
          itemListElement: list.map((p, i) => ({
            '@type': 'ListItem', position: i + 1, url: productUrl(p.slug), name: p.name,
            item: { '@type': 'Product', '@id': productUrl(p.slug) + '#product', name: p.name, url: productUrl(p.slug), sku: p.code || undefined, image: (p.images || []).filter(Boolean).slice(0, 1).map(abs)[0], brand: { '@type': 'Brand', name: 'Artizia' } }
          }))
        }
      },
      crumbs([['Home', '/'], ['Collections', '/collections'], ...(coll ? [[coll, url]] : [])])
    )
  };
}

/* These pages are written with relative links — assets/css/styles.css, and a
   warranty link inside a config block — and they are now served from addresses
   a level or two down. One <base> keeps every one of them resolving against the
   site root, including the links the page's own script builds at runtime. */
const withBase = (html) =>
  /<base\s/i.test(html) ? html : html.replace(/(<meta charset="[^"]*">)/i, (m, tag) => tag + '\n<base href="/">');

/* ---- express handlers ---- */
function noCache(res) { res.setHeader('Cache-Control', 'no-cache'); res.type('html'); }

function productPage(req, res, next) {
  try {
    const html = withBase(template('product.html'));
    const slug = String(req.params.slug || req.query.p || '').trim();
    const m = slug ? Product.bySlug(slug) : null;
    noCache(res);
    if (m) return res.send(productBody(inject(html, productHead(m)), m));
    /* A name that belongs to no surface is a dead address and says so: a 200
       here is a soft 404, which Google reports and keeps re-crawling. */
    if (slug) res.status(404);
    res.send(html.replace(/<\/title>/i, '</title>\n<meta name="robots" content="noindex">'));
  } catch (e) { next(e); }
}

/* product.html?p=oceana, the address every existing link uses */
function productRedirect(req, res, next) {
  const slug = String(req.query.p || '').trim();
  const m = slug ? Product.bySlug(slug) : null;
  if (m) return res.redirect(301, productPath(m.slug));
  if (slug) return productPage(req, res, next);   /* a name that names nothing: 404 */
  return res.redirect(301, '/collections');       /* no name at all: the catalogue */
}

function collectionsPage(req, res, next) {
  try {
    const slug = String(req.params.slug || '').trim();
    const coll = slug ? collFromSlug(slug) : null;
    if (slug && !coll) return next();   /* no such collection — let it 404 */
    noCache(res);
    res.send(withBase(bannerFill(inject(template('collections.html'), collectionsHead(coll)))));
  } catch (e) { next(e); }
}

/* collections.html, with or without ?c= and ?q= */
function collectionsRedirect(req, res) {
  const coll = collFromSlug(collSlug(String(req.query.c || '').trim()));
  const q = String(req.query.q || '').trim();
  res.redirect(301, collectionPath(coll) + (q ? '?q=' + encodeURIComponent(q) : ''));
}

/* The marketing pages this module completes on the way out: the heading their
   own script would write, and share tags built from their title and canonical.
   product.html and collections.html have handlers of their own. */
const SERVED_PAGES = [
  'index.html', 'about.html', 'blog.html', 'contact.html', 'faq.html', 'certifications.html',
  'warranty.html', 'technical-details.html', 'care-and-maintenance.html', 'become-a-dealer.html',
  'catalogue.html'
];
const BANNER_ROUTES = ['/', ...SERVED_PAGES.flatMap(f => ['/' + f, '/' + f.replace(/\.html$/, '')])];

function staticPage(req, res, next) {
  try {
    const p = req.path.replace(/^\/+/, '');
    const file = p === '' ? 'index.html' : (/\.html$/i.test(p) ? p : p + '.html');
    if (!SERVED_PAGES.includes(file)) return next();
    noCache(res);
    res.send(shareTags(bannerFill(template(file))));
  } catch (e) {
    /* this only ever adds to a page that is already complete — if anything here
       fails, hand the file to the static server untouched */
    console.error('[seo] ' + req.path + ': ' + e.message);
    next();
  }
}

function robots(req, res) {
  res.type('text/plain').setHeader('Cache-Control', 'public, max-age=86400');
  res.send(['User-agent: *', 'Disallow: /admin', 'Disallow: /admin.html', 'Disallow: /api/', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n'));
}

/* address -> the file behind it, whose modification time dates the entry.
   <changefreq> and <priority> are not written: Google ignores both. */
const STATIC_PAGES = [
  ['/', 'index.html'], ['/collections', 'collections.html'], ['/about.html', 'about.html'],
  ['/catalogue', 'catalogue.html'], ['/become-a-dealer.html', 'become-a-dealer.html'], ['/contact.html', 'contact.html'],
  ['/faq.html', 'faq.html'], ['/blog.html', 'blog.html'], ['/certifications.html', 'certifications.html'],
  ['/warranty.html', 'warranty.html'], ['/technical-details.html', 'technical-details.html'], ['/care-and-maintenance.html', 'care-and-maintenance.html']
];
const day = (iso) => (iso ? String(iso).slice(0, 10) : '');
const fileDay = (f) => { try { return new Date(fs.statSync(path.join(ROOT, f)).mtimeMs).toISOString().slice(0, 10); } catch (e) { return ''; } };
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sitemap(req, res) {
  const rows = [];
  const add = (loc, lastmod) => rows.push(
    `<url><loc>${xmlEsc(abs(loc))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
  for (const [loc, file] of STATIC_PAGES) add(loc, fileDay(file));
  const products = Product.all(null);
  /* one entry per collection, newest product in it dating the page */
  const colls = new Map();
  for (const p of products) if (p.coll) {
    const d = day(p.updatedAt);
    if (!colls.has(p.coll) || d > colls.get(p.coll)) colls.set(p.coll, d);
  }
  for (const [coll, d] of colls) add(collectionPath(coll), d);
  for (const p of products) add(productPath(p.slug), day(p.updatedAt));
  for (const p of Post.published()) add(`/blog/${encodeURIComponent(p.slug)}`, day(p.updatedAt || p.publishedAt));
  for (const p of Page.published()) add(`/p/${encodeURIComponent(p.slug)}`, day(p.updatedAt));
  res.type('application/xml').setHeader('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`);
}

module.exports = { productPage, productRedirect, collectionsPage, collectionsRedirect, staticPage, BANNER_ROUTES, robots, sitemap, ORG, WEBSITE, productHead, collectionsHead, inject };
