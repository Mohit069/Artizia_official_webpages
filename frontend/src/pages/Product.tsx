import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { useBodyPage } from '../hooks/site'
import { useArtizia } from '../context/ArtiziaContext'
import { SPECS } from '../data/materials'

const PP = {
  slotLabels: ['Full Slab', 'Close-up', 'Application', 'Detail'],
  sampleNote: 'Free samples · Ships in 5–7 days · Up to 4 per order',
  applicationBlurbs: [
    'Heat- and stain-resistant for the hardest-working surface at home.',
    'Non-porous — resists moisture, soap and daily wear.',
    'Seamless veined cladding for a spa-grade finish.',
    'Feature walls that carry stone drama at scale.',
    'Withstands heat while holding its polish and tone.',
    'Tables and consoles built to outlast trends.',
  ],
  care: {
    text: 'Clean with a soft cloth, warm water and mild detergent. Avoid harsh chemicals and abrasive pads; use trivets under hot cookware and boards when cutting.',
    warranty:
      'Backed by a <b style="color:var(--accent)">15-Year Warranty</b> against manufacturing defects — resisting scratches, stains, heat, household chemicals, mould and mildew. <a href="/warranty.html" style="color:var(--accent)">Full terms →</a>',
  },
}

type View = { type: 'photo' | 'room' | 'live' | 'img'; src?: string; seed?: number; lbl: string }

export default function Product() {
  useBodyPage('collections')
  const { mat, addSample, openModal } = useArtizia()
  const [params] = useSearchParams()
  const slug = params.get('p') || ''
  const bannerRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const [cur, setCur] = useState(0)

  const GL = typeof window !== 'undefined' ? window.MarbleGL : undefined
  let key = slug
  if (!mat[key] || mat[key].hidden) key = Object.keys(mat).find((k) => !mat[k].hidden) || 'calacatta-gold'
  const m = mat[key]

  useEffect(() => setCur(0), [key])

  const photos = (m?.images || []).map((src: string, i: number) => (src ? { src, lbl: PP.slotLabels[i] } : null)).filter(Boolean) as { src: string; lbl: string }[]
  const hasPhotos = photos.length > 0
  const views: View[] = hasPhotos
    ? photos.map((p) => ({ type: 'photo', src: p.src, lbl: p.lbl }))
    : [
        { type: 'live', lbl: 'Full Slab' },
        { type: 'img', seed: 40, lbl: 'Macro' },
        { type: 'room', lbl: 'In Kitchen' },
        { type: 'img', seed: 80, lbl: 'Detail' },
      ]

  /* banner visual — uploaded photo, else a live marble canvas (parity with product.html) */
  useEffect(() => {
    const host = bannerRef.current
    if (!host || !m || !GL) return
    if (hasPhotos) {
      host.innerHTML = `<img src="${photos[0].src}" alt="${m.name}">`
      return
    }
    host.innerHTML = '<canvas id="phgl"></canvas>'
    const c = host.firstElementChild as HTMLCanvasElement
    const ctx = GL.makeGL(c)
    if (!ctx) return
    const t0 = performance.now()
    let raf = 0
    const loop = (now: number) => {
      if (c.clientWidth) GL.draw(ctx, c, m, (now - t0) / 1000, GL.dpr, 1.5)
      if (!GL.reduce) raf = requestAnimationFrame(loop)
    }
    GL.draw(ctx, c, m, 0, GL.dpr, 1.5)
    if (!GL.reduce) raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [key, hasPhotos])

  /* main gallery view — imperative, exactly like product.html setMain()/bindZoom() */
  useEffect(() => {
    const main = mainRef.current
    if (!main || !m || !GL) return
    const v = views[cur]
    if (!v) return
    let raf = 0
    if (v.type === 'live') {
      main.innerHTML = '<canvas id="pmain-gl"></canvas>'
      const c = main.firstElementChild as HTMLCanvasElement
      const ctx = GL.makeGL(c)
      const t0 = performance.now()
      const loop = (now: number) => {
        if (ctx && c.clientWidth) GL.draw(ctx, c, m, (now - t0) / 1000, GL.dpr, 1)
        if (!GL.reduce) raf = requestAnimationFrame(loop)
      }
      if (ctx && !GL.reduce) raf = requestAnimationFrame(loop)
    } else if (v.type === 'photo') {
      main.innerHTML = `<img src="${v.src}" alt="${m.name}">`
      const img = main.querySelector('img') as HTMLImageElement
      main.classList.remove('zoomable', 'zooming')
      if (img && !GL.reduce && matchMedia('(hover:hover)').matches) {
        main.classList.add('zoomable')
        main.insertAdjacentHTML('beforeend', '<span class="zhint">Hover to zoom</span>')
        const ZOOM = 2.4
        const track = (e: PointerEvent) => {
          const r = main.getBoundingClientRect()
          const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
          const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100))
          img.style.transformOrigin = x + '% ' + y + '%'
        }
        main.onpointerenter = (e) => {
          if (e.pointerType !== 'mouse') return
          track(e)
          main.classList.add('zooming')
          img.style.transform = 'scale(' + ZOOM + ')'
        }
        main.onpointermove = (e) => {
          if (main.classList.contains('zooming')) track(e)
        }
        main.onpointerleave = () => {
          main.classList.remove('zooming')
          img.style.transform = ''
        }
      }
    } else if (v.type === 'room') {
      main.innerHTML = GL.roomHTML(key)
    } else {
      main.innerHTML = GL.imgTag(key, v.seed)
    }
    return () => {
      cancelAnimationFrame(raf)
      main.onpointerenter = null
      main.onpointermove = null
      main.onpointerleave = null
    }
  }, [cur, key, hasPhotos])

  if (!m) {
    return (
      <div className="wrap">
        <div className="pdp">
          <p style={{ padding: '60px 0', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
            Product not found. <Link to="/collections.html" style={{ color: 'var(--accent)' }}>Back to collections →</Link>
          </p>
        </div>
      </div>
    )
  }

  const apps: string[] = m.apps || []
  const pool = Object.keys(mat).filter((k) => !mat[k].hidden && k !== key)
  const same = pool.filter((k) => mat[k].coll === m.coll)
  const pairs = same.concat(pool).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)

  const thumbHTML = (v: View) => {
    if (v.type === 'photo') return `<img src="${v.src}" alt="${m.name}">`
    if (v.type === 'room') return GL!.roomHTML(key)
    return GL!.imgTag(key, v.seed || 0)
  }

  return (
    <>
      <Seo title={`${m.name} — Artizia Quartz`} description="Explore this Artizia engineered quartz surface — design details, applications, technical specifications and free samples." />

      <section className="page-hero compact" id="phero">
        <div className="ph-vis" ref={bannerRef} />
        <div className="wrap">
          <div className="crumb" id="crumb" style={{ padding: '0 0 18px' }}>
            <Link to="/index.html">Home</Link>
            <span>/</span>
            <Link to="/collections.html">Collections</Link>
            <span>/</span>
            <Link to={`/collections.html?c=${m.coll}`}>{m.coll}</Link>
            <span>/</span>
            <b>{m.name}</b>
          </div>
          <span className="eyebrow" id="pheye">{m.coll} Collection</span>
          <h1 id="phtitle" style={{ fontSize: 'clamp(40px,6vw,80px)', lineHeight: 0.96, marginTop: 16 }}>{m.name}</h1>
        </div>
      </section>

      <div className="wrap">
        <div className="pdp">
          <div className="pgal">
            <div className="pmain" id="pmain" ref={mainRef} />
            <div className="pthumbs" id="pthumbs">
              {views.map((v, i) => (
                <div
                  className={`pth ${i === cur ? 'active' : ''}`}
                  data-i={i}
                  key={i}
                  onClick={() => setCur(i)}
                  dangerouslySetInnerHTML={{ __html: thumbHTML(v) + `<span class="tl">${v.lbl}</span>` }}
                />
              ))}
            </div>
          </div>
          <div className="pinfo" id="pinfo">
            <div className="code">NO. {m.code} · QUARTZ SURFACE</div>
            <p className="pdesc">{m.desc}</p>
            <div className="scg">
              <div className="s"><div className="k">Vein</div><div className="v">{m.veinText || m.vein}</div></div>
              <div className="s"><div className="k">Grain</div><div className="v">{m.grain}</div></div>
              <div className="s"><div className="k">Finish</div><div className="v">{m.finish}</div></div>
              <div className="s"><div className="k">Thickness</div><div className="v">{m.thickness}</div></div>
            </div>
            <div className="pact">
              <a className="btn btn-fill mag" href="#" id="addBtn" onClick={(e) => { e.preventDefault(); addSample(key, e.currentTarget) }}>
                <span>Add Free Sample <span className="arw">→</span></span>
              </a>
              <a className="btn btn-line mag" href="#" id="quoteBtn" onClick={(e) => { e.preventDefault(); openModal('quote') }}>
                <span>Get a Quote</span>
              </a>
            </div>
            <div className="pnote">{PP.sampleNote}</div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="psec" id="psec">
          <details className="acc" open>
            <summary>Where it lives <span className="pm">+</span></summary>
            <div className="body">
              <div className="apps">
                {apps.map((a, i) => (
                  <div className="app" key={i}>
                    <div>
                      <span className="an">0{i + 1}</span>
                      <h4>{a}</h4>
                    </div>
                    <p>{PP.applicationBlurbs[i] || ''}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
          <details className="acc" open>
            <summary>Technical details <span className="pm">+</span></summary>
            <div className="body">
              <div className="spwrap">
                <table className="sp">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Test Standard</th>
                      <th style={{ textAlign: 'right' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SPECS.map((s, i) => (
                      <tr key={i}>
                        <td>{s[0]}</td>
                        <td className="st">{s[1]}</td>
                        <td className="rs">{s[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
          <details className="acc">
            <summary>Care &amp; warranty <span className="pm">+</span></summary>
            <div className="body">
              <p style={{ marginBottom: 14 }}>{PP.care.text}</p>
              <p dangerouslySetInnerHTML={{ __html: PP.care.warranty }} />
            </div>
          </details>
        </div>
      </div>

      <section className="pad">
        <div className="wrap">
          <div className="sec-head rv" style={{ marginBottom: 36 }}>
            <span className="eyebrow">Pairs Well With</span>
            <h2>Complete <em>the palette.</em></h2>
          </div>
          <div className="pairs" id="pairs">
            {pairs.map((k) => (
              <Link className="pair" to={`/product.html?p=${k}`} key={k}>
                <div className="frame" dangerouslySetInnerHTML={{ __html: GL ? GL.imgFor(k, 0) : '' }} />
                <div className="pn">{mat[k].name}</div>
                <div className="pc">{mat[k].coll} Collection</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
