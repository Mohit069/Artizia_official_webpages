/* ============================================================
   Writes the static structured data (JSON-LD) into the marketing pages.

   The Organization and WebSite nodes come from server/seo.js, so the static
   pages and the server-rendered product / collections pages describe the
   company identically. Run it again after changing either:

       node server/scripts/inject-schema.js

   Idempotent: each page carries one <script data-schema="site"> block that is
   replaced in place. Pages that build their own JSON-LD in the browser (FAQ,
   blog posts) keep it — this block sits beside it.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { ORG, WEBSITE } = require('../seo');

const ROOT = path.join(__dirname, '..', '..');
const SITE = ORG.url.replace(/\/$/, '');
const org = { '@id': ORG['@id'] };
const site = { '@id': WEBSITE['@id'] };

const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + url }))
});
const page = (type, url, name, description, extra) => Object.assign({
  '@type': type, '@id': SITE + url + '#webpage', url: SITE + url, name, description,
  isPartOf: site, about: org, inLanguage: 'en'
}, extra || {});

/* one entry per page: the page node, then its breadcrumb trail */
const PAGES = {
  'index.html': [
    page('WebPage', '/', 'Premium Quartz Manufacturer and Quartz Exporter in India | Artizia Quartz Masterpieces',
      'Artizia is a premium quartz manufacturer and quartz exporter in India offering engineered quartz slabs, Jumbo quartz surfaces and premium designs for residential, commercial and hospitality projects.')
  ],
  'about.html': [
    page('AboutPage', '/about.html', 'About Artizia — Quartz Slab Manufacturer, Exporter & Supplier',
      'Artizia is a quartz slab manufacturer, exporter and supplier with 40 years of heritage, a retail expansion of Marudhar Group, Jaipur.'),
    crumbs([['Home', '/'], ['About', '/about.html']])
  ],
  'contact.html': [
    page('ContactPage', '/contact.html', 'Contact Artizia', 'Request samples, quotes or design guidance from Artizia, Mahindra World City, Jaipur.'),
    crumbs([['Home', '/'], ['Contact', '/contact.html']])
  ],
  'faq.html': [
    page('WebPage', '/faq.html', 'FAQ — Quartz Slabs, Sizes, Samples & Installation | Artizia',
      'Answers on Artizia quartz slabs — sizes, colours, samples, delivery, installation and the 15-year warranty.'),
    crumbs([['Home', '/'], ['FAQ', '/faq.html']])
  ],
  'blog.html': [
    page('CollectionPage', '/blog.html', 'Journal — Artizia Quartz', 'Design notes, project stories and technical guidance on engineered quartz surfaces from the Artizia team.'),
    crumbs([['Home', '/'], ['Journal', '/blog.html']])
  ],
  'certifications.html': [
    page('WebPage', '/certifications.html', 'Certifications — Artizia Quartz', 'Artizia quartz is GreenGuard and NSF certified — low emissions, food-safe surfaces and independent quality assurance.'),
    crumbs([['Home', '/'], ['Certifications', '/certifications.html']])
  ],
  'warranty.html': [
    page('WebPage', '/warranty.html', 'Warranty — Artizia Quartz', 'Every Artizia engineered quartz surface is backed by a 15-Year Warranty against manufacturing defects.'),
    crumbs([['Home', '/'], ['Warranty', '/warranty.html']])
  ],
  'technical-details.html': [
    page('WebPage', '/technical-details.html', 'Technical Details — Artizia Quartz', 'Full technical specifications for Artizia engineered quartz — tested to EN and ASTM standards.'),
    crumbs([['Home', '/'], ['Technical Details', '/technical-details.html']])
  ],
  'care-and-maintenance.html': [
    page('WebPage', '/care-and-maintenance.html', 'Care & Maintenance — Artizia Quartz', 'How to care for an Artizia engineered quartz surface — everyday cleaning, preventing damage and long-term maintenance.'),
    crumbs([['Home', '/'], ['Care & Maintenance', '/care-and-maintenance.html']])
  ],
  'become-a-dealer.html': [
    page('WebPage', '/become-a-dealer.html', 'Become a Dealer — Artizia Quartz', 'Apply to become an authorised Artizia dealer and bring premium engineered quartz surfaces to your market.'),
    crumbs([['Home', '/'], ['Become a Dealer', '/become-a-dealer.html']])
  ],
  'catalogue.html': [
    page('WebPage', '/catalogue', 'Artizia Catalogue — Premium Engineered Quartz Surfaces', 'The full Artizia catalogue — every design, collection and specification in one PDF.',
      { mainEntity: { '@type': 'DigitalDocument', name: 'Artizia Catalogue', url: SITE + '/catalogue.pdf', encodingFormat: 'application/pdf', publisher: org } }),
    crumbs([['Home', '/'], ['Catalogue', '/catalogue']])
  ]
};

const jsonForScript = (o) => JSON.stringify(o).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
const BLOCK = /<script type="application\/ld\+json" data-schema="site">[\s\S]*?<\/script>\n?/;

for (const [file, nodes] of Object.entries(PAGES)) {
  const f = path.join(ROOT, file);
  let html = fs.readFileSync(f, 'utf8');
  const block = `<script type="application/ld+json" data-schema="site">${jsonForScript({ '@context': 'https://schema.org', '@graph': [ORG, WEBSITE, ...nodes] })}</script>\n`;
  if (BLOCK.test(html)) html = html.replace(BLOCK, block);
  else html = html.replace(/<\/head>/i, block + '</head>');
  fs.writeFileSync(f, html);
  console.log('schema →', file);
}
