import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'
import { useArtizia } from '../context/ArtiziaContext'
import { SPECS } from '../data/materials'

const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'volcanic-ash',
    zoom: 1.4,
    eyebrow: 'Resources · Technical',
    title: 'The numbers <em>behind the beauty.</em>',
    lead: "Every Artizia surface is tested to international EN and ASTM standards. Here's exactly how our quartz performs.",
  },
  specs: [] as { property: string; standard: string; result: string }[],
  note: 'Values are typical ranges for Artizia engineered quartz and may vary by design and finish. Available in <b style="color:var(--text)">20 mm and 30 mm</b> thicknesses, standard slab format <b style="color:var(--text)">3300 × 1650 mm</b>. Finishes: Polished, Honed (selected designs).',
  cta: {
    eyebrow: 'Specifying a Project?',
    title: "We'll help you <em>get it right.</em>",
    text: 'Request samples, full spec sheets or design guidance from our team.',
  },
}

export default function Technical() {
  useBodyPage('technical')
  const { openTray } = useArtizia()
  const rows: [string, string, string][] = PAGE.specs.length
    ? PAGE.specs.map((s) => [s.property, s.standard, s.result])
    : SPECS
  const c = PAGE.cta
  return (
    <>
      <Seo
        title="Technical Details — Artizia Quartz"
        description="Full technical specifications for Artizia engineered quartz — tested to EN and ASTM standards for strength, absorption, abrasion and chemical resistance."
        canonical="https://artizia.co.in/technical-details.html"
      />
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(20px,4vw,50px)' }}>
        <div className="wrap">
          <div className="spwrap rv">
            <table className="sp">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Test Standard</th>
                  <th style={{ textAlign: 'right' }}>Result</th>
                </tr>
              </thead>
              <tbody id="spbody">
                {rows.map((s, i) => (
                  <tr key={i}>
                    <td>{s[0]}</td>
                    <td className="st">{s[1]}</td>
                    <td className="rs">{s[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="prose rv" style={{ marginTop: 50 }}>
            <p className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }} id="spNote" dangerouslySetInnerHTML={{ __html: PAGE.note }} />
          </div>
        </div>
      </section>

      <section className="cta pad">
        <div className="wrap rv">
          <span className="eyebrow center" id="ctaEye">{c.eyebrow}</span>
          <h2 style={{ marginTop: 22 }} id="ctaTitle" dangerouslySetInnerHTML={{ __html: c.title }} />
          <p id="ctaText">{c.text}</p>
          <div className="row">
            <a className="btn btn-fill mag" href="#" id="ctaSamples" onClick={(e) => { e.preventDefault(); openTray() }}>
              <span>Request Samples <span className="arw">→</span></span>
            </a>
            <Link className="btn btn-line mag" to="/contact.html"><span>Contact Us</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}
