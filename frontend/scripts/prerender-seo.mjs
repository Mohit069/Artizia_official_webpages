/* Emits one static HTML file per marketing route, each carrying that route's exact
   <title>, meta description, canonical and Open Graph tags in the STATIC head — so
   search crawlers and social scrapers (which don't run JS) see the same SEO the
   current site serves today. The body still hydrates as the React SPA. Matches the
   current site's per-page SEO tag-for-tag (OG only on home + about, etc.). */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')

const ROUTES = [
  {
    file: 'index.html',
    title: 'Artizia — Quartz Slab Manufacturer & Exporter | Luxury Quartz Surfaces, India',
    description: 'Artizia is a quartz slab manufacturer and exporter crafting luxury quartz surfaces in Jaipur, India. Super jumbo quartz slabs, white quartz slabs and 53 designs across five collections — pressed on Breton technology, warranted for 15 years.',
    canonical: 'https://artizia.co.in/',
    og: [['og:title', 'Artizia — Quartz Slab Manufacturer & Exporter | Luxury Quartz Surfaces'], ['og:description', 'Super jumbo quartz slabs and luxury quartz surfaces, engineered in Jaipur and exported worldwide. Free samples, shipped across India in 5–7 days.'], ['og:type', 'website']],
  },
  {
    file: 'about.html',
    title: 'About Artizia — Quartz Slab Manufacturer, Exporter & Supplier | Jaipur, India',
    description: 'Artizia is a quartz slab manufacturer, exporter and supplier with 40 years of heritage. Super jumbo quartz slabs and luxury quartz surfaces — white, ivory and beige tones with golden veins — for kitchen countertops, bathroom vanities, table tops and commercial projects. Made on Breton technology in Jaipur.',
    canonical: 'https://artizia.co.in/about.html',
    og: [['og:title', 'About Artizia — Quartz Slab Manufacturer, Exporter & Supplier'], ['og:description', '40 years of engineered-stone heritage. A quartz slab supplier to North America, the UK and Australia — now crafting luxury quartz surfaces and super jumbo quartz slabs for India.'], ['og:type', 'website']],
  },
  { file: 'collections.html', title: 'Collections — Artizia Quartz Surfaces', description: 'Explore 53 engineered quartz surfaces across five Artizia collections — Signature, Luxury, Premium, Classic and Essentials.', canonical: 'https://artizia.co.in/collections.html' },
  { file: 'certifications.html', title: 'Certifications — Artizia Quartz', description: 'Artizia quartz is GreenGuard, NSF and Kosher certified — proof of low emissions, food-safe surfaces and independent quality assurance.', canonical: 'https://artizia.co.in/certifications.html' },
  { file: 'technical-details.html', title: 'Technical Details — Artizia Quartz', description: 'Full technical specifications for Artizia engineered quartz — tested to EN and ASTM standards for strength, absorption, abrasion and chemical resistance.', canonical: 'https://artizia.co.in/technical-details.html' },
  { file: 'warranty.html', title: 'Warranty — Artizia Quartz', description: 'Every Artizia engineered quartz surface is backed by a 15-Year Warranty against manufacturing defects — scratches, stains, heat, chemicals, mould and mildew.', canonical: 'https://artizia.co.in/warranty.html' },
  { file: 'care-and-maintenance.html', title: 'Care & Maintenance — Artizia Quartz', description: 'How to care for your Artizia engineered quartz surface — everyday cleaning, preventing damage and long-term maintenance. No sealing required.', canonical: 'https://artizia.co.in/care-and-maintenance.html' },
  { file: 'faq.html', title: 'FAQ — Quartz Slabs, Sizes, Samples & Installation | Artizia', description: 'Answers on Artizia quartz slabs — super jumbo 3200 × 1600 mm sizes, white, ivory and beige quartz, samples, delivery, installation and the 15-year warranty. From a leading quartz slab manufacturer and exporter in Jaipur, India.', canonical: 'https://artizia.co.in/faq.html' },
  { file: 'contact.html', title: 'Contact — Artizia Quartz', description: 'Get in touch with Artizia — request samples, quotes or design guidance. Based at Mahindra World City, Jaipur.', canonical: 'https://artizia.co.in/contact.html' },
  { file: 'blog.html', title: 'Journal — Artizia Quartz', description: 'Design notes, project stories and technical guidance on engineered quartz surfaces — from the Artizia team in Jaipur.', canonical: 'https://artizia.co.in/blog.html' },
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const shell = await readFile(join(dist, 'index.html'), 'utf8')

for (const r of ROUTES) {
  const tags = [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}">`,
    `<link rel="canonical" href="${esc(r.canonical)}">`,
    ...(r.og || []).map(([p, c]) => `<meta property="${esc(p)}" content="${esc(c)}">`),
  ].join('\n')
  const html = shell.replace('</head>', tags + '\n</head>')
  await writeFile(join(dist, r.file), html)
}
console.log(`[prerender-seo] wrote ${ROUTES.length} SEO route files`)
