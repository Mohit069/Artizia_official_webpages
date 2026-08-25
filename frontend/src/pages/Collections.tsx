import { Link, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'
import { useArtizia } from '../context/ArtiziaContext'
import { COLLECTIONS } from '../data/materials'
import { firstPhoto } from '../lib/marble'

const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'grigio-cloud',
    zoom: 1.3,
    eyebrow: 'The Collections · 53 Surfaces',
    title: 'Our <em>Collections</em>',
    lead: 'From marble-veined luxury to quiet everyday essentials — every Artizia surface is engineered on Breton technology and backed for 15 years.',
  },
  cta: {
    eyebrow: 'Not sure which?',
    title: 'Order the ones <em>you love.</em>',
    text: "Add up to four surfaces to your sample set and we'll ship physical samples, free.",
  },
}

/* card visual: full slab fitted, blurred copy fills the frame behind it (hidden by
   CSS .bed) — falls back to generated marble when no photo exists yet. */
function CardArt({ k, name }: { k: string; name: string }) {
  const photo = firstPhoto(k)
  if (photo)
    return (
      <>
        <img className="bed" src={photo} alt="" aria-hidden="true" loading="lazy" />
        <img className="slab" src={photo} alt={name} loading="lazy" />
      </>
    )
  const url = window.MarbleGL?.marbleImg(k, 0)
  if (url) return <img src={url} alt={`${name} engineered quartz surface`} loading="lazy" />
  return <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#222,#555)' }} />
}

export default function Collections() {
  useBodyPage('collections')
  const { mat, ready, addSample, openTray } = useArtizia()
  const [params, setParams] = useSearchParams()
  const active = params.get('c') || 'All'
  const query = (params.get('q') || '').trim()
  const cats = ['All', ...COLLECTIONS.map((c) => c.key)]

  const list = Object.keys(mat)
    .filter((k) => !mat[k].hidden)
    .filter((k) => active === 'All' || mat[k].coll === active)
    .filter((k) => {
      if (!query) return true
      const m = mat[k]
      const t = query.toLowerCase()
      return [m.name, m.code, m.coll, m.desc, m.veinText, m.finish, m.grain, (m.apps || []).join(' ')].some((v) =>
        String(v || '').toLowerCase().includes(t),
      )
    })

  const setFilter = (c: string) => {
    const q = new URLSearchParams()
    if (c !== 'All') q.set('c', c)
    if (query) q.set('q', query)
    setParams(q, { replace: true })
  }
  const clearSearch = () => {
    const q = new URLSearchParams()
    if (active !== 'All') q.set('c', active)
    setParams(q, { replace: true })
  }

  const c = PAGE.cta
  return (
    <>
      <Seo
        title="Collections — Artizia Quartz Surfaces"
        description="Explore 53 engineered quartz surfaces across five Artizia collections — Signature, Luxury, Premium, Classic and Essentials."
        canonical="https://artizia.co.in/collections.html"
      />
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(30px,4vw,50px)' }}>
        <div className="wrap">
          <div className="filters" id="filters">
            {cats.map((cat) => (
              <button key={cat} data-c={cat} className={cat === active ? 'active' : ''} onClick={() => setFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>
          <div className="qbar" id="qbar" hidden={!query}>
            {query && (
              <>
                <span>
                  {list.length} {list.length === 1 ? 'surface' : 'surfaces'} matching “{query.replace(/[<>&]/g, '')}”
                </span>
                <button id="qclear" onClick={clearSearch}>
                  Clear search ✕
                </button>
              </>
            )}
          </div>
          <div className="mgrid" id="grid">
            {!ready ? null : list.length ? (
              list.map((k) => {
                const m = mat[k]
                return (
                  <div className="mcard rv" key={k}>
                    <Link className="mimg" to={`/product.html?p=${k}`} aria-label={m.name}>
                      <CardArt k={k} name={m.name} />
                    </Link>
                    <button
                      className="madd"
                      aria-label={`Add ${m.name} to samples`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        addSample(k, e.currentTarget)
                      }}
                    >
                      +
                    </button>
                    <div className="minfo">
                      <Link className="mtxt" to={`/product.html?p=${k}`}>
                        <div className="mcoll">
                          {m.coll} · No. {m.code}
                        </div>
                        <div className="mtitle">{m.name}</div>
                        <div className="mdesc">{m.desc}</div>
                      </Link>
                      <Link className="marw" to={`/product.html?p=${k}`} aria-label={`View ${m.name}`}>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="no-hits">
                Nothing matches that search. <Link to="/collections.html">Show every surface →</Link>
              </p>
            )}
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
              <span>Build a Sample Set <span className="arw">→</span></span>
            </a>
            <Link className="btn btn-line mag" to="/contact.html"><span>Talk to Us</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}
