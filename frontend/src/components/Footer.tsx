import { Link } from 'react-router-dom'
import { SITE } from '../data/site'
import { useArtizia } from '../context/ArtiziaContext'

const SOCIAL_ICONS: Record<string, string> = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none"/>',
  facebook: '<path d="M11.2 21V8.6a2.5 2.5 0 0 1 2.5-2.5h1.9"/><path d="M8.5 12.9h6.1"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7.6" y1="10.6" x2="7.6" y2="17"/><circle cx="7.6" cy="7.1" r="1.05" fill="currentColor" stroke="none"/><path d="M11.2 17v-3.5a2.3 2.3 0 0 1 4.6 0V17"/><line x1="11.2" y1="10.6" x2="11.2" y2="17"/>',
}
const SOCIAL_NAMES: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' }

export default function Footer() {
  const { openTray } = useArtizia()
  const social = SITE.social as Record<string, string>
  const S = SITE

  return (
    <footer>
      <div className="wrap">
        <div className="ftop">
          <div className="fb">
            <div className="brand">
              <img className="logo lockup" src="/assets/img/brand/logo-full.png" alt="Artizia — Quartz Masterpieces" width={178} height={44} />
            </div>
            <p>Premium engineered quartz — global craftsmanship, Indian design sensibility. Built on 35 years of heritage.</p>
            <div className="fsoc">
              {Object.keys(SOCIAL_ICONS)
                .filter((k) => social[k])
                .map((k) => (
                  <a
                    key={k}
                    href={social[k]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Artizia on ${SOCIAL_NAMES[k]}`}
                    title={SOCIAL_NAMES[k]}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: SOCIAL_ICONS[k] }} />
                  </a>
                ))}
            </div>
          </div>
          <div className="fcol">
            <h5>Collections</h5>
            <Link to="/collections.html?c=Signature">Signature</Link>
            <Link to="/collections.html?c=Luxury">Luxury</Link>
            <Link to="/collections.html?c=Premium">Premium</Link>
            <Link to="/collections.html?c=Classic">Classic</Link>
            <Link to="/collections.html?c=Essentials">Essentials</Link>
          </div>
          <div className="fcol">
            <h5>Explore</h5>
            <Link to="/about.html">About</Link>
            <Link to="/blog.html">Blog</Link>
            <Link to="/technical-details.html">Technical Details</Link>
            <Link to="/certifications.html">Certifications</Link>
            <Link to="/warranty.html">Warranty</Link>
            <Link to="/care-and-maintenance.html">Care &amp; Maintenance</Link>
            <Link to="/faq.html">FAQ</Link>
          </div>
          <div className="fcol">
            <h5>Contact</h5>
            <a href={`tel:${S.phoneRaw}`}>{S.phone}</a>
            <a href={`mailto:${S.email}`}>{S.email}</a>
            <a href={S.mapUrl} target="_blank" rel="noopener">
              Mahindra World City,<br />Jaipur — 302037
            </a>
            <a href="#" id="footSamples" style={{ color: 'var(--accent)' }} onClick={(e) => { e.preventDefault(); openTray() }}>
              Request Samples →
            </a>
          </div>
        </div>
        <div className="fbot">
          <span>© 2026 Artizia — All Rights Reserved</span>
          <span>Crafted in Jaipur, India</span>
        </div>
      </div>
    </footer>
  )
}
