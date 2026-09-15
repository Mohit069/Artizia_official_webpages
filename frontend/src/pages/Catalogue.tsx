import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'
import { useArtizia } from '../context/ArtiziaContext'

/* Mirrors catalogue.html — the shareable link that opens the catalogue on the
   site. The static head tags (Open Graph, cover image) for crawlers are baked
   in by prerender-seo.mjs; Seo below covers the client-side render. */
const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'calacatta-gold',
    zoom: 1.3,
    eyebrow: 'The Collection',
    title: 'The Artizia <em>catalogue.</em>',
    lead: 'Every design, every collection, every specification — in one place.',
  },
  labels: {
    open: 'Open in a new tab',
    download: 'Download PDF',
    samples: 'Request Samples',
    openMob: 'Open the Catalogue',
    empty: 'The catalogue is being updated — please check back shortly.',
  },
  cta: {
    eyebrow: 'Seen something you like?',
    title: "Let's put it <em>in your project.</em>",
    text: 'Free samples shipped across India in 5–7 days. Quotes for projects of any size.',
  },
}

const OG_DESC = '53 engineered quartz designs across five collections. Jumbo 3300 × 1650 mm slabs, pressed on Breton Stone technology in Jaipur.'
const mb = (n: number) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB')

export default function Catalogue() {
  useBodyPage('catalogue')
  const { catalogue, openTray } = useArtizia()
  const L = PAGE.labels

  /* any touch device, whatever its size: no inline reader — the cover, and a
     button that hands the file to the device's own viewer. iPads report a coarse
     pointer even in landscape at 1366px, where a frame shows page 1 only. */
  const isTouch = () => typeof matchMedia !== 'undefined' && (matchMedia('(pointer:coarse)').matches || matchMedia('(max-width:820px)').matches)
  /* decided before the first paint, so a phone never mounts the PDF frame even for one frame */
  const [touch] = useState(isTouch)
  useEffect(() => {
    document.body.classList.toggle('cat-touch', touch)
    return () => document.body.classList.remove('cat-touch')
  }, [touch])

  const c = catalogue && catalogue.configured && catalogue.url ? catalogue : null
  const facts = c
    ? [c.type === 'pdf' ? 'PDF' : 'Image', mb(c.size || 0),
       c.updatedAt ? 'updated ' + new Date(c.updatedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '']
        .filter(Boolean).join(' · ')
    : ''

  return (
    <>
      <Seo
        title="Artizia Catalogue — Premium Engineered Quartz Surfaces"
        description="Browse the full Artizia catalogue — 53 engineered quartz designs across five collections, jumbo 3300 × 1650 mm slabs, pressed on Breton Stone technology in Jaipur, India."
        canonical="https://artizia.co.in/catalogue"
        og={[
          ['og:type', 'website'], ['og:site_name', 'Artizia'], ['og:url', 'https://artizia.co.in/catalogue'],
          ['og:title', 'Artizia Catalogue — Premium Engineered Quartz Surfaces'], ['og:description', OG_DESC],
          ['og:image', 'https://artizia.co.in/uploads/catalogue-cover.jpg'],
        ]}
      />
      <style>{`
        .cat-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:clamp(18px,2.4vw,28px)}
        .cat-actions .spacer{flex:1 1 auto}
        .cat-facts{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-faint)}
        .cat-frame{--h:max(640px,calc(100vh - 170px));height:var(--h);width:min(100%,calc((var(--h) - 56px) / 1.414 + 48px));margin:0 auto;border:1px solid var(--line);border-radius:14px;background:var(--surface);display:block}
        .cat-mobile{display:none;max-width:520px;margin:0 auto;text-align:center}
        .cat-mobile .cover{width:100%;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--surface);box-shadow:0 24px 60px rgba(0,0,0,.28)}
        .cat-mobile .cover img{width:100%;height:auto;display:block}
        .cat-mobile .btns{display:flex;flex-direction:column;gap:12px;margin-top:22px}
        .cat-mobile .btn{justify-content:center}
        body.cat-touch .cat-actions,body.cat-touch .cat-frame{display:none}
        body.cat-touch .cat-mobile{display:block}
        .cat-mobile .cat-facts{display:block;margin-top:16px}
        .cat-empty{padding:clamp(40px,6vw,80px) 20px;text-align:center;color:var(--text-dim);border:1px dashed var(--line-2);border-radius:14px}
      `}</style>
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(20px,4vw,50px)' }}>
        <div className="wrap">
          {c ? (
            <>
              <div className="cat-actions rv">
                <a className="btn btn-fill mag" href={c.url} target="_blank" rel="noopener"><span>{L.open} <span className="arw">→</span></span></a>
                <a className="btn btn-line mag" href={c.url} download={c.name || 'artizia-catalogue'}><span>{L.download}</span></a>
                <a className="btn btn-line mag" href="#" onClick={(e) => { e.preventDefault(); openTray() }}><span>{L.samples}</span></a>
                <span className="spacer" />
                <span className="cat-facts">{facts}</span>
              </div>

              {!touch && (c.type === 'pdf'
                ? <iframe className="cat-frame rv d1" title="Artizia catalogue" src={c.url + '#view=Fit&zoom=page-fit&navpanes=0'} />
                : <img src={c.url} alt="Artizia catalogue" style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--line)', borderRadius: 14 }} />)}

              <div className="cat-mobile rv d1">
                {c.cover && <div className="cover"><img src={c.cover + '?v=' + (Date.parse(c.updatedAt || '') || 0)} alt="Artizia catalogue cover" /></div>}
                <div className="btns">
                  <a className="btn btn-fill mag" href={c.url} target="_blank" rel="noopener"><span>{L.openMob} <span className="arw">→</span></span></a>
                  <a className="btn btn-line mag" href={c.url} download={c.name || 'artizia-catalogue'}><span>{L.download}</span></a>
                  <a className="btn btn-line mag" href="#" onClick={(e) => { e.preventDefault(); openTray() }}><span>{L.samples}</span></a>
                </div>
                <span className="cat-facts">{facts}</span>
              </div>
            </>
          ) : catalogue === null ? null /* still fetching — no notice yet */ : (
            <div className="cat-empty rv">{L.empty}</div>
          )}
        </div>
      </section>

      <section className="cta pad">
        <div className="wrap rv">
          <span className="eyebrow center">{PAGE.cta.eyebrow}</span>
          <h2 style={{ marginTop: 22 }} dangerouslySetInnerHTML={{ __html: PAGE.cta.title }} />
          <p>{PAGE.cta.text}</p>
          <div className="row">
            <Link className="btn btn-fill mag" to="/contact.html"><span>Contact Us <span className="arw">→</span></span></Link>
            <Link className="btn btn-line mag" to="/become-a-dealer.html"><span>Become a Dealer</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}
