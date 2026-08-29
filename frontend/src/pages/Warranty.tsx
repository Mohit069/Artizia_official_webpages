import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'

const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'calacatta-gold',
    zoom: 1.4,
    eyebrow: 'Resources · Warranty',
    title: 'Engineered to <em>endure.</em>',
    lead: 'Non-porous, low-maintenance and built to endure — every Artizia surface is backed by a 15-Year Warranty against manufacturing defects.',
  },
  covers: [
    { title: 'Scratches', text: 'Mohs hardness 6.5–7.5 stands up to everyday knocks and abrasion.' },
    { title: 'Stains', text: 'Non-porous surface — spills wipe away without soaking in.' },
    { title: 'Heat', text: 'Rated Class A for surface burning; use trivets for direct cookware.' },
    { title: 'Chemicals', text: 'Resists household chemicals, acids and solvents (Class C4).' },
    { title: 'Mould & Mildew', text: 'Non-porous and hygienic — nowhere for bacteria to grow.' },
    { title: 'Time', text: 'Colour and finish engineered to stay true for the life of the surface.' },
  ],
  compare: {
    columns: ['Artizia Quartz', 'Granite', 'Laminate', 'Solid Surface'],
    rows: [
      { feature: 'Non-porous', cells: [['Yes', true], ['Sealing needed', false], ['No', false], ['Yes', true]] as [string, boolean][] },
      { feature: 'Scratch resistance', cells: [['High', true], ['High', true], ['Low', false], ['Medium', false]] as [string, boolean][] },
      { feature: 'Heat resistance', cells: [['Class A', true], ['High', true], ['Low', false], ['Low', false]] as [string, boolean][] },
      { feature: 'Maintenance', cells: [['Low', true], ['Periodic sealing', false], ['Low', true], ['Low', true]] as [string, boolean][] },
      { feature: '15-year warranty', cells: [['Yes', true], ['Varies', false], ['No', false], ['Varies', false]] as [string, boolean][] },
    ],
  },
  terms: {
    eyebrow: 'The Fine Print',
    title: 'Terms &amp; conditions.',
    body: [
      'The Artizia 15-Year Warranty covers manufacturing defects in material and workmanship for the original purchaser, in normal residential use, when the surface is professionally installed with standard installation.',
      '<b>Not covered:</b> damage from misuse, impact, extreme heat without trivets, improper installation, alteration, or use of abrasive/harsh chemical cleaners. Natural variation in colour and veining is a feature of engineered stone, not a defect.',
      'To request a Claim Form, contact us with your proof of purchase and installation details. Full warranty documentation is provided with every order.',
    ],
  },
}

export default function Warranty() {
  useBodyPage('warranty')
  const { compare, terms } = PAGE
  return (
    <>
      <Seo
        title="Warranty — Artizia Quartz"
        description="Every Artizia engineered quartz surface is backed by a 15-Year Warranty against manufacturing defects — scratches, stains, heat, chemicals, mould and mildew."
        canonical="https://artizia.co.in/warranty.html"
      />
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(20px,4vw,50px)' }}>
        <div className="wrap">
          <div className="sec-head rv" style={{ marginBottom: 36 }}>
            <span className="eyebrow">What's Covered</span>
            <h2>Your surface resists.</h2>
          </div>
          <div className="value-grid rv" id="covers">
            {PAGE.covers.map((c) => (
              <div className="value-cell" key={c.title}>
                <span className="vi">✦</span>
                <h4 dangerouslySetInnerHTML={{ __html: c.title }} />
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head rv" style={{ marginBottom: 36 }}>
            <span className="eyebrow">How It Compares</span>
            <h2>Not all surfaces <em>are equal.</em></h2>
          </div>
          <div className="compare rv">
            <table className="cmp">
              <thead>
                <tr id="cmpHead">
                  <th>Feature</th>
                  {compare.columns.map((c, i) => (
                    <th key={c} className={i === 0 ? 'col-artizia' : undefined}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody id="cmpBody">
                {compare.rows.map((r) => (
                  <tr key={r.feature}>
                    <th>{r.feature}</th>
                    {r.cells.map(([label, ok], i) => (
                      <td key={i} className={i === 0 ? 'col-artizia' : undefined}>
                        <span className={ok ? 'yes' : 'no'}>
                          {ok ? '●' : '○'} {label}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="prose rv">
            <span className="eyebrow" id="tEye">{terms.eyebrow}</span>
            <h3 id="tTitle" dangerouslySetInnerHTML={{ __html: terms.title }} />
            <div id="tBody">
              {terms.body.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link className="btn btn-fill mag" to="/contact.html"><span>Claim Form →</span></Link>
              <Link className="btn btn-line mag" to="/care-and-maintenance.html"><span>Care Guide</span></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
