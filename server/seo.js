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
  for (const [p, c] of h.og || []) if (c) extra.push(`<meta property="${escAttr(p)}" content="${escAttr(c)}">`);
  if (h.jsonLd) extra.push(`<script type="application/ld+json">${jsonForScript(h.jsonLd)}</script>`);
  if (extra.length) out = out.replace(/<\/head>/i, `${extra.join('\n')}\n</head>`);
  return out;
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
const productUrl = (slug) => `${SITE_URL}/product.html?p=${encodeURIComponent(slug)}`;
const collectionUrl = (coll) => `${SITE_URL}/collections.html?c=${encodeURIComponent(coll)}`;

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
      ['og:image', image ? abs(image) : LOGO]
    ],
    jsonLd: graph(
      productNode(m),
      crumbs([['Home', '/'], ['Collections', '/collections.html'], ...(m.coll ? [[m.coll, collectionUrl(m.coll)]] : []), [m.name, url]])
    )
  };
}

function collectionsHead(coll) {
  const all = Product.all(null);
  const list = coll ? all.filter(p => p.coll === coll) : all;
  const url = coll ? collectionUrl(coll) : SITE_URL + '/collections.html';
  const title = coll ? `${coll} Collection — Artizia Quartz Surfaces` : 'Collections — Artizia Quartz Surfaces';
  const description = coll
    ? `${list.length} engineered quartz surfaces in the Artizia ${coll} collection. Jumbo ${SLAB} slabs, pressed on Breton Stone technology in Jaipur, India.`
    : `Explore ${all.length} engineered quartz surfaces across five Artizia collections — Signature, Luxury, Premium, Classic and Essentials.`;
  return {
    title, description,
    /* the filtered views are the same page narrowed — one canonical */
    canonical: SITE_URL + '/collections.html',
    og: [['og:type', 'website'], ['og:site_name', 'Artizia'], ['og:url', url], ['og:title', title], ['og:description', description], ['og:image', LOGO]],
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
      crumbs([['Home', '/'], ['Collections', '/collections.html'], ...(coll ? [[coll, url]] : [])])
    )
  };
}

/* ---- express handlers ---- */
function noCache(res) { res.setHeader('Cache-Control', 'no-cache'); res.type('html'); }

function productPage(req, res, next) {
  try {
    const html = template('product.html');
    const slug = String(req.query.p || '').trim();
    const m = slug ? Product.bySlug(slug) : null;
    noCache(res);
    /* an unknown slug still gets the template — the page's own script picks a
       fallback product, as it always has — but nothing to index */
    res.send(m ? inject(html, productHead(m)) : html.replace(/<\/title>/i, '</title>\n<meta name="robots" content="noindex">'));
  } catch (e) { next(e); }
}

function collectionsPage(req, res, next) {
  try {
    const coll = String(req.query.c || '').trim();
    noCache(res);
    res.send(inject(template('collections.html'), collectionsHead(coll || null)));
  } catch (e) { next(e); }
}

function robots(req, res) {
  res.type('text/plain').setHeader('Cache-Control', 'public, max-age=86400');
  res.send(['User-agent: *', 'Disallow: /admin', 'Disallow: /admin.html', 'Disallow: /api/', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n'));
}

const STATIC_PAGES = [
  ['/', '1.0', 'weekly'], ['/collections.html', '0.9', 'weekly'], ['/about.html', '0.7', 'monthly'],
  ['/catalogue', '0.7', 'monthly'], ['/become-a-dealer.html', '0.7', 'monthly'], ['/contact.html', '0.6', 'monthly'],
  ['/faq.html', '0.6', 'monthly'], ['/blog.html', '0.6', 'weekly'], ['/certifications.html', '0.5', 'yearly'],
  ['/warranty.html', '0.5', 'yearly'], ['/technical-details.html', '0.5', 'yearly'], ['/care-and-maintenance.html', '0.5', 'yearly']
];
const day = (iso) => (iso ? String(iso).slice(0, 10) : '');
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sitemap(req, res) {
  const rows = [];
  const add = (loc, lastmod, priority, freq) => rows.push(
    `<url><loc>${xmlEsc(abs(loc))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${freq ? `<changefreq>${freq}</changefreq>` : ''}${priority ? `<priority>${priority}</priority>` : ''}</url>`);
  for (const [loc, pr, freq] of STATIC_PAGES) add(loc, '', pr, freq);
  for (const p of Product.all(null)) add(`/product.html?p=${encodeURIComponent(p.slug)}`, day(p.updatedAt), '0.8', 'monthly');
  for (const p of Post.published()) add(`/blog/${encodeURIComponent(p.slug)}`, day(p.updatedAt || p.publishedAt), '0.6', 'monthly');
  for (const p of Page.published()) add(`/p/${encodeURIComponent(p.slug)}`, day(p.updatedAt), '0.5', 'monthly');
  res.type('application/xml').setHeader('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`);
}

module.exports = { productPage, collectionsPage, robots, sitemap, ORG, WEBSITE, productHead, collectionsHead, inject };
