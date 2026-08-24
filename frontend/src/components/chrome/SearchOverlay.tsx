import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArtizia } from '../../context/ArtiziaContext'

const norm = (s: any) => String(s || '').toLowerCase()

/* ranking ported verbatim from app.js match() */
function match(q: string) {
  const t = norm(q).trim()
  if (!t) return [] as { k: string; m: any; score: number }[]
  const M = window.MAT || {}
  return Object.keys(M)
    .filter((k) => !M[k].hidden && k !== 'hero')
    .map((k) => {
      const m = M[k]
      const name = norm(m.name),
        code = norm(m.code),
        coll = norm(m.coll)
      let score = 0
      if (name === t) score = 100
      else if (name.startsWith(t)) score = 80
      else if (code === t) score = 75
      else if (name.includes(t)) score = 60
      else if (code.includes(t) || coll.includes(t)) score = 40
      else if ([m.desc, m.veinText, m.finish, m.grain, (m.apps || []).join(' ')].some((v) => norm(v).includes(t)))
        score = 20
      return score ? { k, m, score } : null
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score || a.m.name.localeCompare(b.m.name))
    .slice(0, 8) as { k: string; m: any; score: number }[]
}

function thumb(k: string): string {
  const photo = window.MarbleGL?.firstPhoto(k)
  return photo ? `<img src="${photo}" alt="" loading="lazy">` : window.MarbleGL?.imgTag(k, 0) || ''
}

export default function SearchOverlay() {
  const { searchOpen, closeSearch, ready } = useArtizia()
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(-1)
  const hits = useMemo(() => match(q), [q, ready])

  useEffect(() => {
    if (searchOpen) {
      setQ('')
      setPick(-1)
      const reduce = window.MarbleGL?.reduce
      const t = setTimeout(() => inputRef.current?.focus(), reduce ? 0 : 120)
      return () => clearTimeout(t)
    }
  }, [searchOpen])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setPick((p) => Math.min(p + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setPick((p) => Math.max(p - 1, -1))
    } else if (e.key === 'Enter') {
      const query = q.trim()
      if (!query) return
      closeSearch()
      if (pick >= 0) nav('/product.html?p=' + hits[pick].k)
      else nav('/collections.html?q=' + encodeURIComponent(query))
    }
  }

  return (
    <div
      className={`search${searchOpen ? ' open' : ''}`}
      id="search"
      role="dialog"
      aria-modal="true"
      aria-label="Search surfaces"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearch()
      }}
    >
      <div className="search-panel">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <line x1="15.8" y1="15.8" x2="20" y2="20" />
          </svg>
          <input
            ref={inputRef}
            id="searchInput"
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search surfaces — name, code, collection…"
            aria-label="Search surfaces"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPick(-1)
            }}
            onKeyDown={onKey}
          />
          <button className="icn" aria-label="Close search" style={{ border: 0 }} onClick={closeSearch}>
            ✕
          </button>
        </div>
        <div className="search-results" id="searchResults" role="listbox">
          {!q.trim() ? (
            <p className="search-hint">Search by name, code, collection or finish.</p>
          ) : !hits.length ? (
            <p className="search-hint">
              No surfaces match “{q.replace(/[<>&]/g, '')}”.{' '}
              <a href="/collections.html" onClick={(e) => { e.preventDefault(); closeSearch(); nav('/collections.html') }}>
                Browse all collections →
              </a>
            </p>
          ) : (
            <>
              {hits.map(({ k, m }, i) => (
                <a
                  className={`sres${i === pick ? ' on' : ''}`}
                  role="option"
                  href={`/product.html?p=${k}`}
                  data-i={i}
                  key={k}
                  onClick={(e) => {
                    e.preventDefault()
                    closeSearch()
                    nav('/product.html?p=' + k)
                  }}
                >
                  <span className="sres-img" dangerouslySetInnerHTML={{ __html: thumb(k) }} />
                  <span className="sres-txt">
                    <b>{m.name}</b>
                    <span>
                      {m.coll} · No. {m.code}
                    </span>
                  </span>
                  <span className="sres-go">→</span>
                </a>
              ))}
              <a
                className="sres-all"
                href={`/collections.html?q=${encodeURIComponent(q.trim())}`}
                onClick={(e) => {
                  e.preventDefault()
                  closeSearch()
                  nav('/collections.html?q=' + encodeURIComponent(q.trim()))
                }}
              >
                See all results in Collections →
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
