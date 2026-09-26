/* Structured data (schema.org JSON-LD) — mirrors server/seo.js, which serves
   the same nodes on the legacy pages. Keep the two in step. */
import { SITE } from './site'
import type { Material } from './materials'

export const SITE_URL = 'https://artizia.co.in'
const LOGO = SITE_URL + '/assets/img/brand/logo-full.png'
/* 1200x630, what a page without a picture of its own shows when shared */
export const SHARE_IMAGE = SITE_URL + '/assets/img/og-home.jpg'
export const abs = (u?: string) => (!u ? '' : /^https?:\/\//i.test(u) ? u : SITE_URL + (u.startsWith('/') ? u : '/' + u))

export const ORG = {
  '@type': 'Organization',
  '@id': SITE_URL + '/#organization',
  name: 'Artizia',
  alternateName: 'Artizia by Marudhar',
  url: SITE_URL + '/',
  logo: { '@type': 'ImageObject', url: LOGO },
  image: LOGO,
  description:
    'Quartz slab manufacturer, exporter and supplier of jumbo quartz slabs and luxury engineered quartz surfaces for kitchen countertops, bathroom vanities, table tops and commercial projects — pressed on Breton Stone technology in Jaipur, India.',
  telephone: SITE.phone,
  email: SITE.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Plot No. PA-008-020-023, Mahindra World City Jaipur, Bhambhoriya Sanganer',
    addressLocality: 'Jaipur',
    addressRegion: 'Rajasthan',
    postalCode: '302037',
    addressCountry: 'IN',
  },
  contactPoint: [
    { '@type': 'ContactPoint', contactType: 'sales', telephone: SITE.phone, email: SITE.email, availableLanguage: ['en', 'hi'] },
    { '@type': 'ContactPoint', contactType: 'sales', telephone: SITE.whatsapp, url: 'https://wa.me/' + SITE.whatsappRaw.replace(/\D/g, ''), name: 'WhatsApp', availableLanguage: ['en', 'hi'] },
  ],
  parentOrganization: { '@type': 'Organization', name: 'Marudhar Group' },
  sameAs: [SITE.social.instagram, SITE.social.linkedin].filter(Boolean),
}

export const WEBSITE = {
  '@type': 'WebSite',
  '@id': SITE_URL + '/#website',
  url: SITE_URL + '/',
  name: 'Artizia',
  publisher: { '@id': SITE_URL + '/#organization' },
  inLanguage: 'en',
}

export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': [ORG, WEBSITE, ...nodes] })

export const crumbs = (items: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(url) })),
})

export const webPage = (type: string, url: string, name: string, description?: string, extra?: object) =>
  Object.assign(
    { '@type': type, '@id': abs(url) + '#webpage', url: abs(url), name, description, isPartOf: { '@id': WEBSITE['@id'] }, about: { '@id': ORG['@id'] }, inLanguage: 'en' },
    extra || {},
  )

/* ---- products ---- */
export const SLAB = '3300 × 1650 mm'
export const productUrl = (slug: string) => `${SITE_URL}/product.html?p=${encodeURIComponent(slug)}`
export const collectionUrl = (coll: string) => `${SITE_URL}/collections.html?c=${encodeURIComponent(coll)}`

export function productNode(m: Material & { slug?: string; code?: string; coll?: string }, slug: string) {
  const images = (m.images || []).filter(Boolean).map(abs)
  const props = ([['Vein', m.veinText], ['Grain', m.grain], ['Finish', m.finish], ['Thickness', m.thickness], ['Slab size', SLAB]] as [string, string | undefined][])
    .filter(([, v]) => v)
    .map(([name, value]) => ({ '@type': 'PropertyValue', name, value }))
  const node: Record<string, unknown> = {
    '@type': 'Product',
    '@id': productUrl(slug) + '#product',
    name: m.name,
    sku: m.code || undefined,
    description: m.desc || undefined,
    url: productUrl(slug),
    brand: { '@type': 'Brand', name: 'Artizia' },
    manufacturer: { '@id': ORG['@id'] },
    category: m.coll ? `${m.coll} Collection` : undefined,
    material: 'Engineered quartz',
    additionalProperty: props,
  }
  if (images.length) node.image = images
  if (m.apps && m.apps.length) node.keywords = m.apps.join(', ')
  return node
}

export function productHead(m: Material & { code?: string; coll?: string }, slug: string) {
  const title = `${m.name} — ${m.coll ? m.coll + ' Collection ' : ''}Quartz Slab | Artizia`
  const specs = [m.veinText, m.grain && m.grain + ' grain', m.finish && m.finish + ' finish', m.thickness].filter(Boolean).join(' · ')
  const description = `${m.desc || ''} ${specs ? specs + '. ' : ''}Jumbo ${SLAB} engineered quartz slabs by Artizia, Jaipur. Free samples across India.`.trim()
  const image = (m.images || []).find(Boolean)
  const url = productUrl(slug)
  return {
    title,
    description,
    canonical: url,
    og: [
      ['og:type', 'website'], ['og:site_name', 'Artizia'], ['og:url', url],
      ['og:title', `${m.name} — Artizia Quartz`], ['og:description', m.desc || description],
      ['og:image', image ? abs(image) : SHARE_IMAGE],
      ['twitter:card', 'summary_large_image'],
    ] as [string, string][],
    jsonLd: graph(
      productNode(m, slug),
      crumbs([['Home', '/'], ['Collections', '/collections.html'], ...(m.coll ? ([[m.coll, collectionUrl(m.coll)]] as [string, string][]) : []), [m.name, url]]),
    ),
  }
}
