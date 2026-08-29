import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'
import { useArtizia } from '../context/ArtiziaContext'

const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'jaipur-fog',
    zoom: 1.4,
    eyebrow: 'Resources · FAQ',
    title: 'Questions, <em>answered.</em>',
    lead: 'Everything you need to know about our quartz slabs — sizes, finishes, samples, delivery, installation and the 15-year warranty.',
  },
  faqs: [
    { q: 'What does Artizia manufacture?', a: 'Artizia is a retail expansion of Marudhar Group, a quartz slab manufacturer and exporter based at Mahindra World City, Jaipur. We engineer premium quartz slabs — jumbo quartz slabs at 3300 × 1650 mm — across 100+ designs, all pressed 100% on Bretonstone technology to global standards of durability and finish.' },
    { q: 'What makes Artizia quartz different?', a: "Three things: the technology, the grade and the scale. Every slab is vibro-compressed on Bretonstone machinery, the benchmark the world's finest luxury quartz surfaces are made on. The grade we ship to North America, the UK and Europe is the grade we sell in India — there is no second tier. And our jumbo format means fewer seams across long islands and table tops." },
    { q: 'Are Artizia surfaces suitable for both homes and commercial projects?', a: 'Yes. Our quartz slabs are specified for kitchen countertops, bathroom vanity tops, dining and table tops, and quartz slabs for commercial projects — hotels, restaurants, offices and retail. The same non-porous, low-maintenance surface that suits a family kitchen also survives a 200-key hotel.' },
    { q: 'Which quartz colours and designs do you offer?', a: 'Our range spans luminous white quartz slabs, warm ivory quartz slabs and soft beige quartz slabs, through to quartz slabs with golden veins for statement islands, and deep charcoals and blacks. From minimal solids to marble-inspired modern quartz designs — browse all 53 across the collections page.' },
    { q: 'What is engineered quartz?', a: 'Engineered quartz combines roughly 90–93% natural quartz aggregate with resins and pigments, compacted under vacuum and vibration on Breton technology. The result is a non-porous surface that is harder, more consistent and more durable than natural stone.' },
    { q: 'What slab sizes and thicknesses are available?', a: 'Our standard format is 3300 × 1650 mm — a jumbo quartz slab — in 20 mm and 30 mm thicknesses, polished or honed. The larger format means longer runs with fewer joints. Availability varies by design, so check the product page for the exact specification.' },
    { q: 'Are Artizia surfaces moisture and fire resistant?', a: 'Yes. Quartz is non-porous, so moisture cannot soak in — which is why it suits bathroom vanities and wet areas without sealing. Our surfaces are also rated Class A for surface burning, and are resistant to mould and mildew.' },
    { q: 'Is Artizia quartz heat resistant?', a: 'It withstands normal kitchen heat, but the resin binder can scorch under prolonged or direct heat. Always use a trivet under hot cookware — no engineered quartz, from any manufacturer, is designed to take a pan straight off the flame.' },
    { q: 'Do I need to seal my Artizia surface?', a: 'No. Artizia quartz is non-porous, so it never needs sealing — unlike granite or marble, which require resealing every year or two.' },
    { q: 'How do I clean and maintain my quartz surface?', a: 'A soft cloth and mild detergent, and that is the entire maintenance schedule. Avoid harsh chemicals, bleach and abrasive pads, which can dull the polish. Spills — coffee, wine, oil — wipe away without soaking in.' },
    { q: 'Can I order samples before placing an order?', a: 'Yes, and we recommend it — colour reads differently under your own light. Use the sample tray on any product page: samples are free, ship anywhere in India in 5–7 days, and you may request up to four at a time.' },
    { q: 'How long does delivery take?', a: "Lead times depend on the design, thickness and order size. Tell us the project and we'll confirm a delivery estimate before you commit — our team in Jaipur usually comes back the same working day." },
    { q: 'Do you offer custom designs or bulk supply?', a: "Yes. As a quartz slab supplier to projects large and small, we handle custom requirements and bulk orders for developers, architects and fabricators. Share the specification and we'll quote it." },
    { q: 'Do you provide installation?', a: "Installation is available through certified fabrication partners, and availability varies by region. Contact our team with your location and we'll connect you with the right installer." },
    { q: 'How do I make sure my slab is installed correctly?', a: 'Use a professional fabricator. Templating, seam placement, cut-outs and support all affect how the finished surface looks and lasts — a jumbo slab is heavy, and it rewards being handled by someone who does it every day.' },
    { q: 'What does the warranty cover?', a: 'A 15-Year Warranty against manufacturing defects, covering scratches, stains, heat, household chemicals, mould and mildew. See the warranty page for the full terms.' },
  ],
  cta: { eyebrow: 'Still Curious?', title: "We're happy <em>to help.</em>", text: 'Reach our team in Jaipur for anything not covered here.' },
}

export default function Faq() {
  useBodyPage('faq')
  const { openTray } = useArtizia()
  const list = PAGE.faqs
  const c = PAGE.cta
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: String(f.a).replace(/<[^>]+>/g, '') },
    })),
  }
  return (
    <>
      <Seo
        title="FAQ — Quartz Slabs, Sizes, Samples & Installation | Artizia"
        description="Answers on Artizia quartz slabs — jumbo 3300 × 1650 mm sizes, white, ivory and beige quartz, samples, delivery, installation and the 15-year warranty. From a leading quartz slab manufacturer and exporter in Jaipur, India."
        canonical="https://artizia.co.in/faq.html"
        jsonLd={jsonLd}
      />
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(20px,4vw,50px)' }}>
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div id="faqs">
            {list.map((f, i) => (
              <details className="faq-item" key={i} open={i === 0}>
                <summary>
                  {f.q}
                  <span className="pm">+</span>
                </summary>
                <div className="fa" dangerouslySetInnerHTML={{ __html: f.a }} />
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta pad">
        <div className="wrap rv">
          <span className="eyebrow center" id="ctaEye">{c.eyebrow}</span>
          <h2 style={{ marginTop: 22 }} id="ctaTitle" dangerouslySetInnerHTML={{ __html: c.title }} />
          <p id="ctaText">{c.text}</p>
          <div className="row">
            <Link className="btn btn-fill mag" to="/contact.html"><span>Contact Us <span className="arw">→</span></span></Link>
            <a className="btn btn-line mag" href="#" id="ctaSamples" onClick={(e) => { e.preventDefault(); openTray() }}><span>Request Samples</span></a>
          </div>
        </div>
      </section>
    </>
  )
}
