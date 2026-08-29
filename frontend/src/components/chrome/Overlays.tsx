import { useEffect, useRef, useState } from 'react'
import { useArtizia } from '../../context/ArtiziaContext'

const HOVER_SEL = 'a,button,summary,input,select,textarea,.gcard,.pcard,.pair,.pth,.why-row'

export function Toast() {
  const { toastMsg } = useArtizia()
  return (
    <div
      id="toast"
      style={{
        opacity: toastMsg ? 1 : 0,
        transform: toastMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(40px)',
      }}
    >
      {toastMsg}
    </div>
  )
}

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches
    const reduce = window.MarbleGL?.reduce
    if (!fine || reduce) {
      if (dot.current) dot.current.style.display = 'none'
      if (ring.current) ring.current.style.display = 'none'
      return
    }
    let mx = innerWidth / 2,
      my = innerHeight / 2,
      rx = mx,
      ry = my,
      raf = 0
    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (dot.current) {
        dot.current.style.left = mx + 'px'
        dot.current.style.top = my + 'px'
      }
    }
    const loop = () => {
      rx += (mx - rx) * 0.16
      ry += (my - ry) * 0.16
      if (ring.current) {
        ring.current.style.left = rx + 'px'
        ring.current.style.top = ry + 'px'
      }
      raf = requestAnimationFrame(loop)
    }
    const over = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.(HOVER_SEL)) document.body.classList.add('hovering')
    }
    const out = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.(HOVER_SEL)) document.body.classList.remove('hovering')
    }
    addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)
    loop()
    return () => {
      removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', out)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <>
      <div className="cursor" id="cursor" ref={dot} />
      <div className="cursor-ring" id="cursorRing" ref={ring} />
    </>
  )
}

const CAT_KEY = 'artizia_catalogue_unlocked'
const catUnlocked = () => { try { return localStorage.getItem(CAT_KEY) === '1' } catch { return false } }
const markCatUnlocked = () => { try { localStorage.setItem(CAT_KEY, '1') } catch {} }

const ROLES = ['Importer', 'Wholesaler', 'Distributor', 'Architect', 'Other']
const DIALS: [string, string][] = [['+91', 'IN'], ['+1', 'US'], ['+44', 'UK'], ['+61', 'AU'], ['+971', 'AE'], ['+65', 'SG'], ['+49', 'DE'], ['+33', 'FR']]

/* Hand the file over. Only ever called straight from a click: a window.open
   that follows an await is treated as a popup and blocked. */
function deliverCatalogue(c: { url?: string; type?: string; name?: string }) {
  if (!c.url) return
  const a = document.createElement('a')
  a.href = c.url
  a.rel = 'noopener'
  if (c.type === 'pdf') a.target = '_blank'
  else a.download = c.name || 'artizia-catalogue'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function CatalogueTab() {
  const { catalogue } = useArtizia()
  const [gate, setGate] = useState(false)
  const [done, setDone] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (!catalogue || !catalogue.configured || !catalogue.url) return null
  const isPdf = catalogue.type === 'pdf'

  const onTab = () => {
    /* anyone who has already given their details goes straight through — the
       gate captures a lead once, it is not a toll booth */
    if (catUnlocked()) deliverCatalogue(catalogue)
    else { setErr(''); setDone(''); setGate(true) }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const g = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value || ''
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'catalogue',
          name: g('name'),
          email: g('email'),
          role: g('role'),
          phone: g('dial') + ' ' + g('phone').trim(),
          subject: 'Catalogue download',
          website: g('website'),
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Could not open the catalogue.')
      markCatUnlocked()
      setDone(g('name').split(' ')[0] || '')
    } catch (ex: any) {
      setErr('✕ ' + ex.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className="cat-tab mag" onClick={onTab}
        aria-label={'Open the Artizia catalogue' + (isPdf ? ' (PDF)' : '')}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H15l5 5v12.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20.5z" />
          <path d="M14 3v6h6" />
          <path d="M8 13h8M8 17h5" />
        </svg>
        <span>Catalogue</span>
      </button>

      {gate && (
        <div className="modal open" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setGate(false) }}>
          <div className="mcard">
            <button className="mx" aria-label="Close" onClick={() => setGate(false)}>✕</button>
            {done ? (
              <div className="msucc">
                <div className="tick">✓</div>
                <h3>Thank you</h3>
                <p style={{ color: 'var(--text-dim)', margin: '12px 0 26px' }}>Your catalogue is ready{done ? ', ' + done : ''}.</p>
                {/* a click of its own — the open must not trail the fetch */}
                <button className="btn btn-fill mag" onClick={() => { deliverCatalogue(catalogue); setGate(false) }}>
                  <span>Open Catalogue →</span>
                </button>
              </div>
            ) : (
              <>
                <span className="eyebrow">Artizia Catalogue</span>
                <h3>Where should we send it?</h3>
                <p>Tell us who you are and the catalogue opens straight away.</p>
                <form className="form" onSubmit={onSubmit}>
                  <div className="g2">
                    <div className="field"><label>Full Name</label><input name="name" required autoComplete="name" placeholder="Your name" /></div>
                    <div className="field"><label>Personal / Business Email</label><input name="email" type="email" required autoComplete="email" placeholder="you@company.com" /></div>
                  </div>
                  <div className="g2">
                    <div className="field">
                      <label>I am an</label>
                      <select name="role" required defaultValue="">
                        <option value="" disabled>Select one</option>
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Phone No</label>
                      <div className="phone-row">
                        <select name="dial" className="dial" aria-label="Country dialling code" defaultValue="+91">
                          {DIALS.map(([d, c]) => <option key={d} value={d}>{c} {d}</option>)}
                        </select>
                        <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="98765 43210" />
                      </div>
                    </div>
                  </div>
                  <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  {err && <p className="mono" style={{ fontSize: 11, color: '#E0716A' }}>{err}</p>}
                  <div className="mfoot">
                    <button type="button" className="btn btn-line mag" onClick={() => setGate(false)}><span>Cancel</span></button>
                    <button type="submit" className="btn btn-fill mag" disabled={busy}><span>View Catalogue →</span></button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
