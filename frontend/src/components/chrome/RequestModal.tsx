import { useState } from 'react'
import { useArtizia } from '../../context/ArtiziaContext'

export default function RequestModal() {
  const { modalMode, closeModal, samples, mat } = useArtizia()
  const [err, setErr] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ name: string; email: string } | null>(null)

  if (!modalMode) return null
  const q = modalMode === 'quote'
  const list = samples.length ? samples.map((k) => (mat[k] || { name: k }).name).join(' · ') : 'None selected yet'

  const onClose = () => {
    setErr('')
    setSending(false)
    setDone(null)
    closeModal()
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    setSending(true)
    setErr('')
    const g = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value || ''
    const payload = {
      type: q ? 'quote' : 'sample',
      name: g('name'),
      phone: g('phone'),
      email: g('email'),
      address: g('address'),
      projectType: g('projectType'),
      area: g('area'),
      products: samples.map((k) => (window.MAT[k] || {}).name || k),
      website: g('website'),
    }
    try {
      const r = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Could not send your request.')
      setDone({ name: payload.name, email: payload.email })
    } catch (ex: any) {
      setErr('✕ ' + ex.message)
      setSending(false)
    }
  }

  return (
    <div
      className="modal open"
      id="modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mcard">
        <button className="mx" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <div id="modal-body">
          {done ? (
            <div className="msucc">
              <div className="tick">✓</div>
              <h3>Request received</h3>
              <p style={{ color: 'var(--text-dim)', margin: '12px 0 26px' }}>
                Thank you, {done.name.split(' ')[0] || 'there'}. Our team will be in touch on{' '}
                <b style={{ color: 'var(--accent)' }}>{done.email}</b> shortly.
              </p>
              <button className="btn btn-fill mag" onClick={onClose}>
                <span>Done</span>
              </button>
            </div>
          ) : (
            <>
              <span className="eyebrow">{q ? 'Request a Quote' : 'Request Free Samples'}</span>
              <h3>{q ? 'Tell us about your project' : 'Where should we send them?'}</h3>
              <p>
                {q
                  ? "We'll come back with pricing and lead time for your selection."
                  : 'Physical samples, shipped free. Up to four surfaces.'}
              </p>
              <div className="msel">
                Selected surfaces: <b>{list}</b>
              </div>
              <form className="form" id="mform" onSubmit={onSubmit}>
                <div className="g2">
                  <div className="field">
                    <label>Full Name</label>
                    <input name="name" required placeholder="Your name" />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input name="phone" required placeholder="+91" />
                  </div>
                </div>
                <div className="field">
                  <label>Email</label>
                  <input name="email" type="email" required placeholder="you@email.com" />
                </div>
                {q ? (
                  <div className="g2">
                    <div className="field">
                      <label>Project Type</label>
                      <select name="projectType">
                        <option>Kitchen</option>
                        <option>Bathroom</option>
                        <option>Commercial</option>
                        <option>Full Home</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Approx. Area (sq ft)</label>
                      <input name="area" placeholder="e.g. 60" />
                    </div>
                  </div>
                ) : (
                  <div className="field">
                    <label>Shipping Address</label>
                    <textarea name="address" rows={2} required placeholder="Street, city, PIN" />
                  </div>
                )}
                <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <p className="mono" style={{ fontSize: 11, color: '#E0716A', display: err ? 'block' : 'none' }}>
                  {err}
                </p>
                <div className="mfoot">
                  <button type="button" className="btn btn-line mag" id="mCancel" onClick={onClose}>
                    <span>Cancel</span>
                  </button>
                  <button type="submit" className="btn btn-fill mag" id="mSend" disabled={sending}>
                    <span>{q ? 'Send Enquiry' : 'Send My Samples'} →</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
