import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { useBodyPage } from '../hooks/site'
import { loadScript } from '../lib/loadScript'
import './about.css'

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
const pad = (n: number) => String(n).padStart(2, '0')

const ICONS: Record<string, string> = {
  breton: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M6 9v3M18 9v3"/><rect x="3" y="12" width="18" height="3" rx="1"/><path d="M5 15v5M19 15v5M9 18h6"/>',
  slab: '<rect x="2" y="7" width="20" height="10" rx="1"/><path d="M2 11h20M8 7v10M16 7v10"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3 8.3-7 10-4-1.7-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  leaf: '<path d="M4 20c0-8 5-13 16-14 0 10-5 15-13 15H4z"/><path d="M9 15c1.5-3 4-5 7-6"/>',
  quarry: '<path d="M3 20l5-9 4 5 3-4 6 8z"/><path d="M3 20h18"/><circle cx="8" cy="6" r="2"/>',
  seal: '<circle cx="12" cy="10" r="6"/><path d="M9 10l2 2 4-4"/><path d="M8 15.5L7 22l5-2 5 2-1-6.5"/>',
}
const Icon = ({ k, cls }: { k: string; cls?: string }) => (
  <span className={cls || 'ic'}>
    <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[k] || ICONS.slab }} />
  </span>
)

const P: any = {
  hero: {
    image: 'assets/img/quartz-crystal.jpg',
    alt: 'Raw quartz mineral — the raw material of every Artizia engineered quartz slab',
    eyebrow: 'About Artizia',
    title: 'Crafting Timeless<br><em>Luxury Quartz Surfaces</em>',
    lead: 'Artizia is a leading Quartz Slab Manufacturer and Quartz Slab Exporter, crafting premium Engineered Quartz Slabs using advanced Breton technology. Designed for architects, designers, fabricators, and homeowners, our Luxury Quartz Surfaces combine durability, precision, and timeless aesthetics for residential and commercial spaces worldwide.',
    cta: { label: 'Explore the Collections', href: 'collections.html' },
    cta2: { label: 'Talk to Our Team', href: 'contact.html' },
    facts: [
      { value: 40, suffix: 'yrs', label: 'Of Heritage' },
      { value: 28, suffix: 'M sq ft', label: 'Produced Annually' },
      { value: 53, suffix: 'designs', label: 'Across Five Collections' },
    ],
  },
  story: {
    video: 'assets/video/Artizia_Marudhar_video.mp4',
    poster: 'assets/img/factory-poster.jpg',
    inset: 'assets/img/calacatta-gold-full.jpg',
    badge: 'Mahindra World City · Jaipur',
    eyebrow: 'The Origin',
    title: 'From a global quartz slab exporter<br>to an <em>Indian original.</em>',
    body: [
      "<b>Crafted for the world. Made for India.</b>",
      "Artizia is born from the global expertise of Marudhar Quartz—one of India’s leading names in engineered stone.",
      "For years, our surfaces have travelled across international markets, finding a place in homes and spaces around the world. Today, we bring that same experience, technology and craftsmanship home.",
      "Every Artizia surface is created with an uncompromising focus on design, precision and performance. From timeless marble-inspired patterns to contemporary designs with striking movement and detail, each collection is crafted to transform everyday spaces into something extraordinary.",
      "<b>Global expertise. Made for your home.</b>",
      "Behind every Artizia slab is advanced manufacturing technology, rigorous quality standards and decades of experience in engineered stone.",
      "Because true luxury isn’t defined by where a product is sold.",
      "It’s defined by how beautifully it performs, how long it lasts, and how effortlessly it becomes part of your life.",
      "<b>Artizia Quartz</b>",
    ],
    pull: "Global craftsmanship. Timeless design. Made for India.",
  },
  manifesto: "Advanced technology and timeless artistry — luxury quartz surfaces that don't simply perform, they <em>inspire.</em>",
  why: {
    eyebrow: 'Why Artizia',
    title: 'Why architects choose us as their <em>quartz slab supplier.</em>',
    cards: [
      { icon: 'breton', title: 'Breton Technology', text: "Every slab is vibro-compressed on Breton machinery — the benchmark the world's leading luxury quartz surfaces are made on." },
      { icon: 'slab', title: 'Jumbo Slabs', text: 'Jumbo quartz slabs at 3300 × 1650 mm, in 20 mm and 30 mm — longer islands, seamless table tops, a cleaner line.' },
      { icon: 'globe', title: 'Export-Grade, at Home', text: 'The grade we ship to North America, the UK and Australia is the grade we sell in India. There is no second tier.' },
      { icon: 'shield', title: '15 Years of Warranty', text: 'Scratch, stain, heat, chemical and mould resistant — and warranted against manufacturing defects for 15 years.' },
      { icon: 'leaf', title: 'Zero-Discharge Plant', text: 'Water recycled in a closed loop, VOC-free materials, and GreenGuard-certified surfaces that keep indoor air clean.' },
      { icon: 'quarry', title: 'Quarry to Container', text: 'Raw material, engineering, finishing and logistics under one roof — so consistency is a process, not a promise.' },
    ],
  },
  making: {
    eyebrow: 'Manufacturing Excellence',
    title: 'Where engineered <em>quartz slabs</em> are made.',
    lead: [
      'At Artizia, manufacturing excellence is driven by innovation, precision, and uncompromising quality. Our state-of-the-art facility utilizes Breton technology and advanced automation to produce premium Engineered Quartz Slabs with outstanding consistency and performance.',
      'Every slab undergoes rigorous quality inspections — from raw material selection to polishing and finishing — to ensure superior durability, flawless aesthetics, and international quality standards. This commitment enables us to deliver world-class Luxury Quartz Surfaces for projects across the globe.',
    ],
    tiles: [
      { size: 'lg', n: '03', title: 'Breton Technology', image: 'assets/img/process/03-breton-technology.jpg', alt: 'Breton vibro-compression press forming engineered quartz slabs' },
      { size: 'wd', n: '01', title: 'Raw Materials', image: 'assets/img/process/01-raw-materials.jpg', alt: 'Raw quartz mineral, the base of every Artizia quartz slab' },
      { size: 'sm', n: '02', title: 'Precision Engineering', image: 'assets/img/process/02-precision-engineering.jpg', alt: 'Precision engineering of quartz slabs for kitchen countertops' },
      { size: 'sm', n: '04', title: 'Quality Inspection', image: 'assets/img/process/04-quality-inspection.jpg', alt: 'Technician measuring a quartz slab during quality inspection' },
      { size: 'wd', n: '05', title: 'Surface Finishing', image: 'assets/img/process/05-surface-finishing.jpg', alt: 'Polishing a white quartz slab with golden veins' },
      { size: 'wd', n: '06', title: 'Global Delivery', image: 'assets/img/process/06-global-delivery.jpg', alt: 'Jumbo quartz slabs crated for export delivery' },
    ],
    pillars: [
      { k: 'Technology', v: 'Breton', l: 'Italian vibro-compression — the engineered-stone benchmark.' },
      { k: 'Quality', v: '100%', l: 'Every slab inspected for colour, density and flatness before it ships.' },
      { k: 'Production', v: '28M sq ft', l: 'Annual capacity of engineered quartz slabs, in 20 mm and 30 mm.' },
    ],
  },
  global: {
    eyebrow: 'Global Presence',
    title: 'Crafted in India. <em>Trusted worldwide.</em>',
    lead: 'From Mahindra World City, Jaipur, our quartz slabs travel to kitchens, showrooms and commercial projects on three continents — and to the home you are planning right now.',
    stops: [{ view: 'world', label: 'World' }, { view: 'india', label: 'India' }, { view: 'rajasthan', label: 'Rajasthan' }, { view: 'jaipur', label: 'Jaipur' }],
    home: { label: 'Jaipur', note: 'Mahindra World City', lon: 75.7873, lat: 26.9124 },
    pins: [],
    stats: [
      { value: 3, suffix: 'continents', label: 'Export Markets' },
      { value: 28, suffix: 'M sq ft', label: 'Annual Capacity' },
      { value: 40, suffix: 'years', label: 'Of Heritage' },
    ],
  },
  values: {
    eyebrow: 'What We Stand On',
    title: 'Five foundations.',
    list: [
      { title: 'Craftsmanship', text: 'Precision-made quartz surfaces that carry intention in every millimetre.' },
      { title: 'Innovation', text: 'Breton technology, delivering consistent, durable, design-forward slabs.' },
      { title: 'Trust', text: 'Three decades of global partnerships, and a reputation we refuse to spend.' },
      { title: 'Aesthetics', text: 'European minimalism, Indian warmth — modern quartz designs that age slowly.' },
      { title: 'Sustainability', text: 'Zero-discharge manufacturing, VOC-free materials, surfaces built to outlast trends.' },
    ],
  },
  certs: {
    eyebrow: 'Certifications & Quality',
    title: 'Proof, <em>not promises.</em>',
    list: [
      { name: 'GreenGuard', image: 'assets/img/certs/greenguard.png', text: 'Certified for low chemical emissions — quartz surfaces that leave the air in your home clean.' },
      { name: 'NSF Certified', image: 'assets/img/certs/nsf.png', text: 'Meets strict public-health standards for food-contact use, wherever you prep, cook and serve.' },
      { name: 'Kosher', image: 'assets/img/certs/kosher.png', text: 'Independently certified kosher, for observant homes and commercial food environments alike.' },
    ],
    warranty: {
      title: 'Backed for 15 years.',
      text: 'Beyond certification, every Artizia quartz slab carries a <b>15-Year Warranty</b> against manufacturing defects — resisting scratches, stains, heat, household chemicals, mould and mildew. Specify it once, and stop thinking about it.',
    },
  },
  cta: {
    image: 'assets/img/carrara-bianco-full.jpg',
    eyebrow: 'See it for Yourself',
    title: 'Feel the <em>surface.</em>',
    text: "Free samples of any white, ivory or golden-veined quartz slab — anywhere in India in 5–7 days. Send us the drawings and we'll quote your project.",
  },
}

const abs = (p: string) => (p ? (p.startsWith('http') || p.startsWith('/') ? p : '/' + p) : '')

export default function About() {
  useBodyPage('about')
  const heroRef = useRef<HTMLElement>(null)
  const hbgRef = useRef<HTMLDivElement>(null)
  const insetRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const ctaBgRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const maniRef = useRef<HTMLParagraphElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLElement>(null)
  const [muted, setMuted] = useState(true)

  const H = P.hero
  let wi = 0
  const titleHTML = (H.title || '').replace(/(<br\s*\/?>)|(<em>.*?<\/em>|[^\s<]+)/g, (m: string, br: string) => (br ? br : `<span class="w" style="--i:${wi++}">${m}</span>`))

  /* world map (map.js -> window.MAPDATA, worldmap.js -> buildWorldMap) */
  useEffect(() => {
    let live = true
    loadScript('/assets/js/map.js')
      .then(() => loadScript('/assets/js/worldmap.js'))
      .then(() => {
        if (!live || !worldRef.current) return
        if (window.MAPDATA && window.buildWorldMap) window.buildWorldMap(worldRef.current, P.global, window.MAPDATA)
        else worldRef.current.innerHTML = '<div class="dots"></div>'
      })
      .catch(() => {
        if (worldRef.current) worldRef.current.innerHTML = '<div class="dots"></div>'
      })
    return () => {
      live = false
    }
  }, [])

  /* manifesto word fade (app.js initManifesto) */
  useEffect(() => {
    const el = maniRef.current
    if (!el) return
    const html = el.innerHTML
    el.innerHTML = html.replace(/(<em>.*?<\/em>|[^\s<]+)/g, (m) => `<span class="w">${m}</span>`)
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((en) => {
          if (en.isIntersecting)
            en.target.querySelectorAll('.w').forEach((w, i) => setTimeout(() => ((w as HTMLElement).style.opacity = w.querySelector('em') ? '1' : '.9'), i * 40))
        }),
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* story video: play only on screen, aspect ratio to real dimensions */
  useEffect(() => {
    const vid = videoRef.current
    const fr = frameRef.current
    if (!vid) return
    const reduce = window.MarbleGL?.reduce
    const onMeta = () => {
      const w = vid.videoWidth,
        h = vid.videoHeight
      if (!w || !h || !fr) return
      fr.style.aspectRatio = `${w}/${h}`
      fr.classList.toggle('portrait', h > w)
    }
    vid.addEventListener('loadedmetadata', onMeta)
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => (e.isIntersecting && !reduce ? vid.play().catch(() => {}) : vid.pause())),
      { threshold: 0.25 },
    )
    io.observe(vid)
    return () => {
      vid.removeEventListener('loadedmetadata', onMeta)
      io.disconnect()
    }
  }, [])

  const toggleMute = () => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = !vid.muted
    setMuted(vid.muted)
    if (!vid.muted) vid.play().catch(() => {})
  }

  /* parallax (about.html frame loop) */
  useEffect(() => {
    const reduce = window.MarbleGL?.reduce
    const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
    const frame = () => {
      const vh = innerHeight
      const hbg = hbgRef.current
      if (hbg && heroRef.current) {
        const r = heroRef.current.getBoundingClientRect()
        if (r.bottom > 0) hbg.style.transform = `translate3d(0,${(-r.top * 0.16).toFixed(1)}px,0)`
      }
      const inset = insetRef.current
      if (inset) {
        const r = inset.getBoundingClientRect()
        if (r.bottom > 0 && r.top < vh) {
          const p = (vh - r.top) / (vh + r.height) - 0.5
          inset.style.transform = `translate3d(0,${(p * -34).toFixed(1)}px,0)`
        }
      }
      const ctaBg = ctaBgRef.current
      if (ctaBg && ctaRef.current) {
        const r = ctaRef.current.getBoundingClientRect()
        if (r.bottom > 0 && r.top < vh) {
          const p = (vh - r.top) / (vh + r.height) - 0.5
          ctaBg.style.transform = `translate3d(0,${(p * -40).toFixed(1)}px,0)`
        }
      }
    }
    let tick = false
    const onScroll = () => {
      if (tick || reduce) return
      tick = true
      requestAnimationFrame(() => {
        frame()
        tick = false
      })
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', frame, { passive: true })
    if (!reduce) frame()
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', frame)
    }
  }, [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Artizia',
    description: 'Quartz slab manufacturer, exporter and supplier of jumbo quartz slabs and luxury quartz surfaces for kitchen countertops, bathroom vanities, table tops and commercial projects.',
    url: 'https://artizia.co.in/',
    logo: 'https://artizia.co.in/assets/img/brand/logo-full.png',
    address: { '@type': 'PostalAddress', addressLocality: 'Jaipur', addressRegion: 'Rajasthan', addressCountry: 'IN', streetAddress: 'Mahindra World City' },
    sameAs: ['https://www.instagram.com/artizia_by_marudhar/'],
  }

  const S = P.story,
    W = P.why,
    M = P.making,
    G = P.global,
    V = P.values,
    C = P.certs,
    X = P.cta

  return (
    <>
      <Seo
        title="About Artizia — Quartz Slab Manufacturer, Exporter & Supplier | Jaipur, India"
        description="Artizia is a quartz slab manufacturer, exporter and supplier with 40 years of heritage. Jumbo quartz slabs and luxury quartz surfaces — white, ivory and beige tones with golden veins — for kitchen countertops, bathroom vanities, table tops and commercial projects. Made on Breton technology in Jaipur."
        canonical="https://artizia.co.in/about.html"
        og={[
          ['og:title', 'About Artizia — Quartz Slab Manufacturer, Exporter & Supplier'],
          ['og:description', '40 years of engineered-stone heritage. A quartz slab supplier to North America, the UK and Australia — now crafting luxury quartz surfaces and jumbo quartz slabs for India.'],
          ['og:type', 'website'],
        ]}
        jsonLd={jsonLd}
      />

      {/* 1 · HERO */}
      <header className="ab-hero" id="abHero" ref={heroRef}>
        <div className="ab-hbg" id="abHbg" ref={hbgRef}>
          {H.image && <img src={abs(H.image)} alt={H.alt || ''} fetchPriority="high" />}
        </div>
        <span className="ab-cue">Scroll</span>
        <div className="wrap ab-hin">
          <span className="eyebrow" id="hEye">{H.eyebrow}</span>
          <h1 id="hTitle" dangerouslySetInnerHTML={{ __html: titleHTML }} />
          <p className="lead" id="hLead">{H.lead}</p>
          <div className="ab-hcta" id="hCta">
            {H.cta && (
              <a className="btn btn-fill mag" href={'/' + H.cta.href.replace(/^\//, '')}>
                <span>{H.cta.label} <span className="arw">→</span></span>
              </a>
            )}
            {H.cta2 && (
              <a className="btn btn-line mag" href={'/' + H.cta2.href.replace(/^\//, '')}>
                <span>{H.cta2.label}</span>
              </a>
            )}
          </div>
        </div>
        <div className="ab-facts">
          <div className="wrap">
            <div className="frow" id="hFacts">
              {H.facts.map((f: any, i: number) => (
                <div className={`f stat rv${i ? ' d' + Math.min(i, 3) : ''}`} key={i}>
                  <div className="num" data-to={+f.value || 0}>
                    <span className="v">0</span>
                    <span className="suf">{f.suffix || ''}</span>
                  </div>
                  <div className="lbl">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 2 · STORY */}
      <section className="pad">
        <div className="wrap">
          <div className="ab-story">
            <div className="ab-svis rv" id="sVis">
              <figure className="fr" id="sFrame" ref={frameRef}>
                {S.badge && <span className="badge">{S.badge}</span>}
                {S.video ? (
                  <>
                    <video id="sVid" ref={videoRef} src={abs(S.video)} poster={S.poster ? abs(S.poster) : undefined} muted loop playsInline preload="metadata" />
                    <button className="mute" id="sMute" type="button" aria-label={muted ? 'Unmute video' : 'Mute video'} onClick={toggleMute}>
                      {muted ? '🔇' : '🔊'}
                    </button>
                  </>
                ) : (
                  <img src={abs(S.poster || '')} alt="Artizia manufacturing, Jaipur" loading="lazy" />
                )}
              </figure>
              {S.inset && (
                <div className="inset" id="sInset" ref={insetRef}>
                  <img src={abs(S.inset)} alt="Calacatta Gold engineered quartz slab detail" loading="lazy" />
                </div>
              )}
            </div>
            <div className="ab-sbody rv d1">
              <span className="eyebrow" id="sEye">{S.eyebrow}</span>
              <h2 id="sTitle" dangerouslySetInnerHTML={{ __html: S.title }} />
              <div id="sBody" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {S.body.map((p: string, i: number) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
              <p className="ab-pull" id="sPull">{S.pull}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 · PHILOSOPHY */}
      <section className="mani pad">
        <div className="wrap">
          <p className="eyebrow rv" style={{ marginBottom: 34 }}>Our Philosophy</p>
          <p className="mani-big" id="mani" ref={maniRef} dangerouslySetInnerHTML={{ __html: P.manifesto }} />
        </div>
      </section>

      {/* 5 · WHY */}
      <section className="pad">
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow" id="wEye">{W.eyebrow}</span>
            <h2 id="wTitle" dangerouslySetInnerHTML={{ __html: W.title }} />
          </div>
          <div className="ab-why" id="whyGrid">
            {W.cards.map((c: any, i: number) => (
              <article className={`ab-wc rv${i % 3 ? ' d' + (i % 3) : ''}`} key={i}>
                <span className="n">{pad(i + 1)}</span>
                <Icon k={c.icon} />
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6 · MANUFACTURING */}
      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="tl-head rv">
            <div className="sec-head">
              <span className="eyebrow" id="mEye">{M.eyebrow}</span>
              <h2 id="mTitle" dangerouslySetInnerHTML={{ __html: M.title }} />
            </div>
            <div className="lead-col" id="mLead">
              {[].concat(M.lead).map((t: string, i: number) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </div>
          <div className="ab-bento" id="bento">
            {M.tiles.map((t: any, i: number) => {
              const cls = `ab-tile ${t.size || 'wd'} rv${i % 3 ? ' d' + (i % 3) : ''}`
              if (!t.image)
                return (
                  <figure className={cls + ' ph'} key={i}>
                    <span className="pht">
                      <b>{t.n} · {t.title}</b>Placeholder — add photo
                    </span>
                  </figure>
                )
              return (
                <figure className={cls} key={i}>
                  <img src={abs(t.image)} alt={t.alt || t.title} loading="lazy" />
                  <span className="sc"></span>
                  <figcaption>
                    <span className="n">{t.n}</span>
                    <span className="t">{t.title}</span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
          <div className="ab-pill rv" id="pillars">
            {M.pillars.map((p: any, i: number) => (
              <div className="ab-pc" key={i}>
                <div className="k">{p.k}</div>
                <div className="v">{p.v}</div>
                <div className="l">{p.l}</div>
              </div>
            ))}
          </div>
          <div className="rv" style={{ marginTop: 'clamp(24px,3vw,38px)' }}>
            <Link className="btn btn-line mag" to="/technical-details.html"><span>Technical Specifications <span className="arw">→</span></span></Link>
          </div>
        </div>
      </section>

      {/* 7 · GLOBAL */}
      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="ab-global">
            <div className="worldmap rv" id="worldmap" ref={worldRef}></div>
            <div className="rv d1">
              <span className="eyebrow" id="gEye">{G.eyebrow}</span>
              <h2 style={{ fontSize: 'clamp(28px,3.8vw,48px)', lineHeight: 1.05, marginTop: 16 }} id="gTitle" dangerouslySetInnerHTML={{ __html: G.title }} />
              <p style={{ color: 'var(--text-dim)', margin: '22px 0 0', maxWidth: '46ch' }} id="gLead">{G.lead}</p>
            </div>
          </div>
          <div className="stats-grid" id="gStats" style={{ marginTop: 'clamp(40px,5vw,70px)' }}>
            {G.stats.map((st: any, i: number) => (
              <div className={`stat rv${i ? ' d' + Math.min(i, 3) : ''}`} key={i}>
                <div className="num" data-to={+st.value || 0}>
                  <span className="v">0</span>
                  <span className="suf">{st.suffix || ''}</span>
                </div>
                <div className="lbl">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · VALUES */}
      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head rv" style={{ marginBottom: 8 }}>
            <span className="eyebrow" id="vEye">{V.eyebrow}</span>
            <h2 id="vTitle" dangerouslySetInnerHTML={{ __html: V.title }} />
          </div>
          <div className="why-list" id="values">
            {V.list.map((f: any, i: number) => (
              <div className="why-row rv" key={i}>
                <span className="i">{pad(i + 1)}</span>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 · CERTIFICATIONS */}
      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow" id="cEye">{C.eyebrow}</span>
            <h2 id="cTitle" dangerouslySetInnerHTML={{ __html: C.title }} />
          </div>
          <div className="ab-certs" id="certs">
            {C.list.map((c: any, i: number) => (
              <article className={`ab-cert rv${i ? ' d' + i : ''}`} key={i}>
                {c.image ? (
                  <div className="cbadge">
                    <img src={abs(c.image)} alt={c.name + ' certification'} loading="lazy" />
                  </div>
                ) : (
                  <Icon k="seal" cls="seal" />
                )}
                <h3>{c.name}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
          <div className="ab-warr rv">
            <div>
              <h3 id="warrTitle">{C.warranty.title}</h3>
              <p id="warrText" dangerouslySetInnerHTML={{ __html: C.warranty.text }} />
            </div>
            <Link className="btn btn-line mag" to="/warranty.html"><span>Warranty Details <span className="arw">→</span></span></Link>
          </div>
        </div>
      </section>

      {/* 10 · CTA */}
      <section className="ab-cta pad" id="abCta" ref={ctaRef}>
        <div className="bg" id="ctaBg" ref={ctaBgRef}>
          {X.image && <img src={abs(X.image)} alt="" aria-hidden="true" loading="lazy" />}
        </div>
        <div className="wrap rv">
          <span className="eyebrow center" id="ctaEye">{X.eyebrow}</span>
          <h2 id="ctaTitle" dangerouslySetInnerHTML={{ __html: X.title }} />
          <p id="ctaText">{X.text}</p>
          <div className="row">
            <Link className="btn btn-fill mag" to="/collections.html"><span>View Collections <span className="arw">→</span></span></Link>
            <Link className="btn btn-line mag" to="/contact.html"><span>Request Samples</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}
