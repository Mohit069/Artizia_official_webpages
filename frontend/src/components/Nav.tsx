import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useArtizia } from '../context/ArtiziaContext'

type NavPage = { slug: string; navLabel?: string; title?: string; inNav?: boolean }

function pageKey(path: string): string {
  const p = path.replace(/\/$/, '') || '/'
  if (p === '/' || p === '/index.html') return 'home'
  if (p.startsWith('/about')) return 'about'
  if (p.startsWith('/collections')) return 'collections'
  if (p.startsWith('/contact')) return 'contact'
  if (p.startsWith('/blog') || p.startsWith('/post')) return 'blog'
  if (p.startsWith('/certifications')) return 'certifications'
  if (p.startsWith('/technical')) return 'technical'
  if (p.startsWith('/warranty')) return 'warranty'
  if (p.startsWith('/care')) return 'care'
  if (p.startsWith('/faq')) return 'faq'
  return ''
}

const esc = (s: any) =>
  String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

export default function Nav() {
  const { samples, openSearch, openTray } = useArtizia()
  const loc = useLocation()
  const page = pageKey(loc.pathname)
  const [scrolled, setScrolled] = useState(typeof scrollY !== 'undefined' && scrollY > 40)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<string>(() =>
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'dark' : 'dark',
  )
  const [customPages, setCustomPages] = useState<NavPage[]>([])
  /* mobile disclosure for the Resources submenu (desktop still uses hover) */
  const [subOpen, setSubOpen] = useState(false)

  useEffect(() => {
    let tick = false
    const onScroll = () => {
      if (tick) return
      tick = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40)
        if (window.__heroScroll) window.__heroScroll()
        tick = false
      })
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // close the mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [loc.pathname, loc.search])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
  }, [menuOpen])

  /* mobile: pre-open the submenu when you are already on one of its pages,
     and collapse it again whenever the menu closes */
  useEffect(() => {
    if (menuOpen) setSubOpen(['certifications', 'technical', 'warranty', 'care', 'faq'].includes(page))
    else setSubOpen(false)
  }, [menuOpen, page])

  useEffect(() => {
    fetch('/api/pages')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: NavPage[]) => setCustomPages((list || []).filter((p) => p.inNav)))
      .catch(() => {})
  }, [])

  const toggleTheme = () => {
    const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', n)
    try {
      localStorage.setItem('artizia_theme', n)
    } catch {}
    setTheme(n)
  }

  const cls = (key: string) => (key === page ? 'active' : '')
  const resourcesActive = ['certifications', 'technical', 'warranty', 'care', 'faq'].includes(page) ? 'active' : ''
  const here = (loc.pathname.match(/\/p\/([a-z0-9-]+)/i) || [])[1]

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
      <Link className="brand" to="/index.html">
        <img className="logo lockup nav-lockup" src="/assets/img/brand/logo-full.png" alt="Artizia — Quartz Masterpieces" width={162} height={40} />
      </Link>
      <div className={`nav-links${menuOpen ? ' open' : ''}`} id="navLinks">
        <button className="close-x icn" id="navClose" aria-label="Close menu" style={{ border: 0 }} onClick={() => setMenuOpen(false)}>
          ✕
        </button>
        <Link to="/index.html" className={cls('home')}>Home</Link>
        <Link to="/about.html" className={cls('about')}>About</Link>
        <Link to="/collections.html" className={cls('collections')}>Collections</Link>
        <div className={`nav-drop${subOpen ? ' open' : ''}`}>
          <Link to="/technical-details.html" className={resourcesActive}>Resources</Link>
          <button
            type="button"
            className="nav-drop-toggle"
            aria-expanded={subOpen}
            aria-controls="nav-sub-resources"
            aria-label={(subOpen ? 'Collapse' : 'Expand') + ' Resources submenu'}
            onClick={() => setSubOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div className="nav-drop-menu" id="nav-sub-resources">
            <Link to="/certifications.html">Certifications</Link>
            <Link to="/technical-details.html">Technical Details</Link>
            <Link to="/warranty.html">Warranty</Link>
            <Link to="/care-and-maintenance.html">Care &amp; Maintenance</Link>
            <Link to="/faq.html">FAQs</Link>
          </div>
        </div>
        <Link to="/contact.html" className={cls('contact')}>Contact</Link>
        <Link to="/blog.html" className={cls('blog')}>Blog</Link>
        {customPages.map((p) => (
          <Link key={p.slug} to={`/p/${p.slug}`} className={here === p.slug ? 'active' : ''} dangerouslySetInnerHTML={{ __html: esc(p.navLabel || p.title) }} />
        ))}
      </div>
      <div className="nav-right">
        <button className="icn" id="searchBtn" title="Search surfaces" aria-label="Search surfaces" onClick={openSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <line x1="15.8" y1="15.8" x2="20" y2="20" />
          </svg>
        </button>
        <button className="icn" id="themeBtn" title="Toggle theme" aria-label="Toggle theme" onClick={toggleTheme}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button className="tbtn" id="trayBtn" onClick={openTray}>
          Samples <span className="tct" id="tct">{samples.length}</span>
        </button>
        <span className="nav-marudhar" id="navMarudhar">
          <img
            className="logo marudhar-lockup"
            src="/assets/img/brand/marudhar-logo.png"
            alt="Marudhar Quartz"
            height={40}
            onError={(e) => { (e.currentTarget.parentNode as HTMLElement).style.display = 'none' }}
          />
        </span>
        <button className="burger" id="burger" aria-label="Menu" onClick={() => setMenuOpen(true)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}
