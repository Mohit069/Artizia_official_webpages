import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'

const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'makrana-mist',
    zoom: 1.4,
    eyebrow: 'Resources · Care',
    title: 'Beautiful <em>with barely any effort.</em>',
    lead: "Non-porous and low-maintenance by design — here's how to keep your Artizia surface looking its best for a lifetime.",
  },
  steps: [
    { tag: '01 · Daily', title: 'Everyday cleaning', points: ['Use a soft cloth or sponge with warm water and a mild detergent.', 'Wipe up spills promptly to keep the surface pristine.', 'Avoid harsh chemicals and abrasive scrubbers that could dull the finish.'] },
    { tag: '02 · Protect', title: 'Preventing damage', points: ["Use a cutting board — don't cut directly on the countertop.", 'Place trivets or pads under pots, pans and hot appliances.', 'Avoid dropping heavy objects, which can chip any hard surface.'] },
    { tag: '03 · Maintain', title: 'Long-term care', points: ['Wipe down regularly to maintain lustre and hygiene.', 'For stubborn marks, use a non-abrasive cleaner made for quartz.', 'No sealing required — quartz is non-porous for life.'] },
  ],
  note: {
    eyebrow: 'Good to Know',
    title: 'Engineered to make life easy.',
    body: ['Because Artizia quartz is <b>non-porous, low-maintenance and resistant to everyday wear</b>, it never needs sealing and resists staining from common household spills. Consistent, gentle care preserves both appearance and performance for years to come.'],
  },
}

export default function Care() {
  useBodyPage('care')
  const { note } = PAGE
  return (
    <>
      <Seo
        title="Care & Maintenance — Artizia Quartz"
        description="How to care for your Artizia engineered quartz surface — everyday cleaning, preventing damage and long-term maintenance. No sealing required."
        canonical="https://artizia.co.in/care-and-maintenance.html"
      />
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(20px,4vw,50px)' }}>
        <div className="wrap">
          <div className="care-grid rv" id="care">
            {PAGE.steps.map((s) => (
              <div className="care" key={s.tag}>
                <span className="ci">{s.tag}</span>
                <h4>{s.title}</h4>
                <ul>
                  {s.points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="prose rv">
            <span className="eyebrow" id="nEye">{note.eyebrow}</span>
            <h3 id="nTitle">{note.title}</h3>
            <div id="nBody">
              {note.body.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link className="btn btn-line mag" to="/warranty.html"><span>Warranty →</span></Link>
              <Link className="btn btn-line mag" to="/faq.html"><span>Read the FAQ</span></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
