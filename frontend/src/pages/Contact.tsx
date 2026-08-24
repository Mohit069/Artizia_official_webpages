import { useEffect, useRef, useState } from 'react'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'
import { useArtizia } from '../context/ArtiziaContext'
import { SITE } from '../data/site'

const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'oceana',
    zoom: 1.3,
    eyebrow: 'Get in Touch',
    title: "Let's build <em>something lasting.</em>",
    lead: 'Questions, samples, quotes or design guidance — our team in Jaipur is here to help.',
  },
  labels: { call: 'Call', email: 'Email', visit: 'Visit', hours: 'Hours' },
  map: {
    eyebrow: 'Find Us',
    title: 'The plant, <em>on the map.</em>',
    lead: 'Our quartz slab manufacturing facility at Mahindra World City, Jaipur — 40 minutes from the city centre, 30 from the airport.',
  },
}

/* Lazy Google embed — the ~700KB iframe only loads when scrolled near, exactly
   like the current page's IntersectionObserver behaviour. */
function ContactMap() {
  const host = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver(
      (es, o) => {
        if (es[0].isIntersecting) {
          o.disconnect()
          setShow(true)
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const q = SITE.mapQuery || SITE.address || 'Mahindra World City Jaipur'
  const src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&z=' + (SITE.mapZoom || 14) + '&hl=en&output=embed'
  return (
    <div className="gmap rv" id="gmap" ref={host}>
      {show && (
        <iframe
          src={src}
          loading="lazy"
          title="Artizia quartz slab plant — Mahindra World City, Jaipur"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      )}
      <div className="gmap-card">
        <span className="k">Artizia · Marudhar Quartz</span>
        <p id="gmapAddr">{SITE.address}</p>
        <a className="btn btn-line mag" id="gmapDir" href={SITE.mapUrl || '#'} target="_blank" rel="noopener">
          <span>Get Directions <span className="arw">→</span></span>
        </a>
      </div>
    </div>
  )
}

export default function Contact() {
  useBodyPage('contact')
  const { openTray } = useArtizia()
  const [result, setResult] = useState<{ color: string; text: string }>({ color: '', text: '' })
  const L = PAGE.labels
  const S = SITE

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const g = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value || ''
    const btn = f.querySelector('#cSend') as HTMLButtonElement
    btn.disabled = true
    setResult({ color: 'var(--text-faint)', text: 'Sending…' })
    try {
      const r = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: g('name'),
          phone: g('phone'),
          email: g('email'),
          subject: g('subject'),
          message: g('message'),
          website: g('website'),
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Could not send your message.')
      f.reset()
      setResult({ color: 'var(--accent)', text: '✓ Message received. We’ll be in touch shortly.' })
    } catch (err: any) {
      setResult({ color: '#E0716A', text: '✕ ' + err.message + ' You can also email ' + (S.email || 'us') + '.' })
    } finally {
      btn.disabled = false
    }
  }

  return (
    <>
      <Seo
        title="Contact — Artizia Quartz"
        description="Get in touch with Artizia — request samples, quotes or design guidance. Based at Mahindra World City, Jaipur."
        canonical="https://artizia.co.in/contact.html"
      />
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(20px,4vw,50px)' }}>
        <div className="wrap">
          <div className="contact-grid">
            <div className="cinfo rv">
              <div className="row"><span className="k">{L.call}</span><a className="v" href={'tel:' + S.phoneRaw}>{S.phone}</a></div>
              <div className="row"><span className="k">{L.email}</span><a className="v" href={'mailto:' + S.email}>{S.email}</a></div>
              <div className="row"><span className="k">{L.visit}</span><span className="v">{S.address}</span></div>
              <div className="row" style={{ border: 0 }}>
                <span className="k">{L.hours}</span>
                <span className="v" style={{ fontSize: 15, lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: S.hours.map((h) => `${h[0]} — ${h[1]}`).join('<br>') }} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a className="btn btn-line mag" href={S.mapUrl} target="_blank" rel="noopener"><span>Open in Maps →</span></a>
                <a className="btn btn-line mag" href="#" onClick={(e) => { e.preventDefault(); openTray() }}><span>Request Samples</span></a>
              </div>
            </div>
            <div className="rv d1">
              <form className="form" id="cform" onSubmit={onSubmit}>
                <div className="g2">
                  <div className="field"><label>Full Name</label><input name="name" required placeholder="Your name" /></div>
                  <div className="field"><label>Phone</label><input name="phone" required placeholder="+91" /></div>
                </div>
                <div className="field"><label>Email</label><input name="email" type="email" required placeholder="you@email.com" /></div>
                <div className="field"><label>Subject</label><input name="subject" placeholder="How can we help?" /></div>
                <div className="field"><label>Message</label><textarea name="message" rows={5} required placeholder="Tell us about your project…" /></div>
                <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <button className="btn btn-fill mag" type="submit" id="cSend"><span>Send Message <span className="arw">→</span></span></button>
                <p className="mono" style={{ fontSize: 11, color: result.color || 'var(--text-faint)' }} id="cResult">{result.text}</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head rv" style={{ marginBottom: 'clamp(22px,3vw,36px)' }}>
            <span className="eyebrow" id="mapEye">{PAGE.map.eyebrow}</span>
            <h2 id="mapTitle" dangerouslySetInnerHTML={{ __html: PAGE.map.title }} />
            <p id="mapLead">{PAGE.map.lead}</p>
          </div>
          <ContactMap />
        </div>
      </section>
    </>
  )
}
