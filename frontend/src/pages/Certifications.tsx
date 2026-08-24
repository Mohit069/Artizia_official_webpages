import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { useBodyPage } from '../hooks/site'
import { VisualSlot } from '../lib/marble'

const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'pearl-white',
    zoom: 1.4,
    eyebrow: 'Resources · Certifications',
    title: 'Proof, <em>not promises.</em>',
    lead: 'Independent certifications that back every Artizia surface — for cleaner air, food-safe use and assured quality.',
  },
  certs: [
    { name: 'GreenGuard', image: 'assets/img/certs/greenguard.png', alt: 'UL GREENGUARD Gold certificate — certified for low chemical emissions, UL 2818', text: 'Certified for low chemical emissions, GreenGuard means Artizia surfaces contribute to healthier indoor air — safe for kitchens, bathrooms and the rooms you live in every day.' },
    { name: 'NSF Certified', image: 'assets/img/certs/nsf.png', alt: 'NSF certification mark for food-contact safe surfaces', text: 'NSF certification confirms our surfaces meet strict public-health standards for food-contact use — safe wherever you prep, cook and eat.' },
    { name: 'Kosher', image: 'assets/img/certs/kosher.png', alt: 'OU Kosher Certification Service mark', text: 'Independently certified kosher, our quartz is approved for use in observant homes and commercial food environments.' },
  ],
  side: {
    eyebrow: 'Warranty',
    title: 'Backed for a lifetime.',
    text: 'Beyond certification, every Artizia surface carries a <b>Lifetime Warranty</b> against manufacturing defects — resisting scratches, stains, heat, household chemicals, mould and mildew.',
    image: 'assets/img/carrara-bianco-full.jpg',
    alt: 'Carrara Bianco — Artizia engineered quartz slab',
    fallback: 'mystique',
    zoom: 1,
  },
}

export default function Certifications() {
  useBodyPage('certifications')
  const s = PAGE.side
  return (
    <>
      <Seo
        title="Certifications — Artizia Quartz"
        description="Artizia quartz is GreenGuard, NSF and Kosher certified — proof of low emissions, food-safe surfaces and independent quality assurance."
        canonical="https://artizia.co.in/certifications.html"
      />
      <section className="page-hero">
        <div className="ph-vis">
          <VisualSlot image={PAGE.banner.image} alt={PAGE.banner.alt} fallback={PAGE.banner.fallback} zoom={PAGE.banner.zoom} />
        </div>
        <div className="wrap">
          <span className="eyebrow">{PAGE.banner.eyebrow}</span>
          <h1 dangerouslySetInnerHTML={{ __html: PAGE.banner.title }} />
          <p className="lead">{PAGE.banner.lead}</p>
        </div>
      </section>

      <section className="pad" style={{ paddingTop: 'clamp(20px,4vw,50px)' }}>
        <div className="wrap">
          <div className="cert-grid" id="certs">
            {PAGE.certs.map((c) => (
              <div className="cert rv" key={c.name}>
                {c.image ? (
                  <div className="cbadge">
                    <img src={'/' + c.image} alt={c.alt || c.name + ' certification'} loading="lazy" />
                  </div>
                ) : (
                  <div className="cmark">✦</div>
                )}
                <h3>{c.name}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="grid-2">
            <div className="prose rv">
              <span className="eyebrow" id="sideEye">{s.eyebrow}</span>
              <h3 id="sideTitle">{s.title}</h3>
              <p id="sideText" dangerouslySetInnerHTML={{ __html: s.text }} />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link className="btn btn-line mag" to="/warranty.html"><span>Warranty Details →</span></Link>
                <Link className="btn btn-line mag" to="/technical-details.html"><span>Technical Specs</span></Link>
              </div>
            </div>
            <div className="feat-vis rv d1" id="sideVis">
              <VisualSlot image={s.image ? '/' + s.image : undefined} alt={s.alt} fallback={s.fallback} zoom={s.zoom} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
