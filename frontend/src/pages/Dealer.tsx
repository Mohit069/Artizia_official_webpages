import { useState } from 'react'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'
import { SITE } from '../data/site'

/* Mirrors become-a-dealer.html — the legacy file is the source of truth for copy. */
const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'calacatta-gold',
    zoom: 1.3,
    eyebrow: 'Partner With Us',
    title: 'Become an <em>Artizia dealer.</em>',
    lead: 'Bring premium engineered quartz to your market — with the backing of a manufacturer that has been doing this for more than 40 years.',
  },
  intro: [
    'Join the Artizia family as an authorised dealer and unlock a world of opportunity. Benefit from our extensive range of premium engineered quartz surfaces, backed by a legacy of excellence spanning over <b>40 years</b>.',
    'Elevate your business with Artizia — where quality meets success.',
  ],
  thanks: '✓ Application received. Our partnerships team will be in touch within two working days.',
}

const DIALS: [string, string][] = [
  ['+91', 'IN'], ['+971', 'AE'], ['+966', 'SA'], ['+974', 'QA'], ['+968', 'OM'], ['+965', 'KW'],
  ['+880', 'BD'], ['+977', 'NP'], ['+94', 'LK'], ['+65', 'SG'], ['+44', 'UK'], ['+1', 'US'],
  ['+61', 'AU'], ['+49', 'DE'], ['+33', 'FR'], ['+39', 'IT'], ['+27', 'ZA'],
]

const COUNTRIES = [
  'India', 'Australia', 'Bangladesh', 'Canada', 'France', 'Germany', 'Italy', 'Kuwait', 'Nepal', 'Oman',
  'Qatar', 'Saudi Arabia', 'Singapore', 'South Africa', 'Sri Lanka', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Other',
]

const IN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

/* People type their country code even though the dropdown supplies it, which
   stored numbers like "+91 +919100184117". Strip a repeated code or a leading
   zero so the two halves join cleanly. */
function joinPhone(dial: string, typed: string): string {
  let n = String(typed || '').trim().replace(/[\s()-]+/g, ' ').trim()
  const code = dial.replace('+', '')
  if (n.startsWith('+' + code)) n = n.slice(code.length + 1).trim()
  else if (n.startsWith('00' + code)) n = n.slice(code.length + 2).trim()
  else if (n.startsWith('+')) return n
  else if (n.startsWith('0')) n = n.replace(/^0+/, '')
  return dial + ' ' + n
}

export default function Dealer() {
  useBodyPage('dealer')
  const [result, setResult] = useState<{ color: string; text: string }>({ color: '', text: '' })

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const g = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value || ''
    const btn = f.querySelector('#dSend') as HTMLButtonElement
    btn.disabled = true
    setResult({ color: 'var(--text-faint)', text: 'Sending…' })
    try {
      const r = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dealer',
          name: g('name'),
          email: g('email'),
          phone: joinPhone(g('dial'), g('phone')),
          country: g('country'),
          state: g('state'),
          city: g('city'),
          dealerships: g('dealerships'),
          subject: 'Dealer application',
          message: g('message'),
          website: g('website'),
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Could not send your application.')
      f.reset()
      setResult({ color: 'var(--accent)', text: PAGE.thanks })
    } catch (err: any) {
      setResult({ color: '#E0716A', text: '✕ ' + err.message + ' You can also email ' + (SITE.email || 'us') + '.' })
    } finally {
      btn.disabled = false
    }
  }

  return (
    <>
      <Seo
        title="Become a Dealer — Artizia Quartz"
        description="Join the Artizia family as an authorised dealer. Bring premium engineered quartz surfaces to your market, backed by a legacy of excellence spanning over 40 years."
        canonical="https://artizia.co.in/become-a-dealer.html"
      />
      <style>{`
        .dealer-intro{max-width:760px;margin:0 auto;text-align:center}
        .dealer-intro p{font-size:clamp(15px,1.5vw,17px);line-height:1.75;color:var(--text-dim);margin:0 0 14px}
        .dealer-intro p b{color:var(--text);font-weight:600}
        .dealer-form{max-width:840px;margin:clamp(30px,4vw,48px) auto 0}
        .dealer-form textarea{min-height:120px}
      `}</style>
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(20px,4vw,50px)' }}>
        <div className="wrap">
          <div className="dealer-intro rv">
            {PAGE.intro.map((t, i) => <p key={i} dangerouslySetInnerHTML={{ __html: t }} />)}
          </div>

          <form className="form dealer-form rv d1" id="dform" onSubmit={onSubmit}>
            <div className="field"><label htmlFor="d_name">Full Name</label><input id="d_name" name="name" required autoComplete="name" placeholder="Your name" /></div>

            <div className="g2">
              <div className="field"><label htmlFor="d_email">Email</label><input id="d_email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" /></div>
              <div className="field">
                <label htmlFor="d_phone">Phone Number</label>
                <div className="phone-row">
                  <select id="d_dial" name="dial" className="dial" aria-label="Country dialling code" defaultValue="+91">
                    {DIALS.map(([d, c]) => <option key={d} value={d}>{c} {d}</option>)}
                  </select>
                  <input id="d_phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="98765 43210" />
                </div>
              </div>
            </div>

            <div className="g2">
              <div className="field">
                <label htmlFor="d_country">Country</label>
                <select id="d_country" name="country" required defaultValue="India">
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="d_state">State</label>
                <input id="d_state" name="state" list="in-states" required autoComplete="address-level1" placeholder="State / province" />
                <datalist id="in-states">{IN_STATES.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
            </div>

            <div className="field"><label htmlFor="d_city">City</label><input id="d_city" name="city" required autoComplete="address-level2" placeholder="Enter city" /></div>

            <div className="field">
              <label htmlFor="d_dealerships">Do you have existing dealerships?</label>
              <select id="d_dealerships" name="dealerships" required defaultValue="">
                <option value="" disabled>Select one</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="d_message">
                Tell us about your business <span style={{ color: 'var(--text-faint)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea id="d_message" name="message" rows={5} placeholder="Showroom, territory, brands you carry, years in business…" />
            </div>

            <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button className="btn btn-fill mag" type="submit" id="dSend"><span>Apply Now <span className="arw">→</span></span></button>
            <p className="mono" style={{ fontSize: 11, color: result.color || 'var(--text-faint)' }} id="dResult">{result.text}</p>
          </form>
        </div>
      </section>
    </>
  )
}
