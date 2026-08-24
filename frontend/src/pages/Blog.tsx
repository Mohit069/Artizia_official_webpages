import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import { useBodyPage } from '../hooks/site'

const PAGE = {
  banner: {
    image: '',
    alt: 'Artizia quartz surface',
    fallback: 'calacatta-valleta',
    zoom: 1.4,
    eyebrow: 'The Journal',
    title: 'Notes on <em>stone.</em>',
    lead: 'Design thinking, project stories and straight answers about engineered quartz.',
  },
}

const PER_PAGE = 9
const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

interface Post {
  slug: string
  title: string
  excerpt?: string
  cover?: string
  publishedAt?: string
  tags?: string[]
}

function coverHTML(p: Post, i: number): string {
  if (p.cover) return `<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">`
  const keys = Object.keys(window.MAT || {}).filter((k) => k !== 'hero')
  if (!keys.length || !window.MarbleGL) return ''
  return window.MarbleGL.imgTag(keys[i % keys.length], i)
}

function pageNumbers(total: number, page: number): (number | '…')[] {
  const out: (number | '…')[] = []
  const near = (n: number) => n === 1 || n === total || Math.abs(n - page) <= 1
  for (let n = 1; n <= total; n++) {
    if (near(n)) out.push(n)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
}

export default function Blog() {
  useBodyPage('blog')
  const [params, setParams] = useSearchParams()
  const [all, setAll] = useState<Post[] | null>(null)
  const [tag, setTag] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let live = true
    fetch('/api/posts')
      .then((r) => r.json())
      .then((list: Post[]) => {
        if (!live) return
        const arr = Array.isArray(list) ? list : []
        const tags = ['All', ...new Set(arr.flatMap((p) => p.tags || []))]
        const t = params.get('tag')
        if (t && tags.includes(t)) setTag(t)
        setPage(Math.max(1, parseInt(params.get('page') || '', 10) || 1))
        setAll(arr)
      })
      .catch(() => setAll([]))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep tag/page in the URL (linkable, survives reload)
  useEffect(() => {
    if (all === null) return
    const q = new URLSearchParams()
    if (tag !== 'All') q.set('tag', tag)
    if (page > 1) q.set('page', String(page))
    setParams(q, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, page, all])

  const list = all ? (tag === 'All' ? all : all.filter((p) => (p.tags || []).includes(tag))) : []
  const total = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const curPage = Math.min(page, total)
  const start = (curPage - 1) * PER_PAGE
  const shown = list.slice(start, start + PER_PAGE)
  const tags = all ? ['All', ...new Set(all.flatMap((p) => p.tags || []))] : ['All']

  const go = (n: number) => {
    setPage(n)
    setTimeout(() => document.getElementById('posts')?.scrollIntoView({ behavior: window.MarbleGL?.reduce ? 'auto' : 'smooth', block: 'start' }), 0)
  }

  return (
    <>
      <Seo
        title="Journal — Artizia Quartz"
        description="Design notes, project stories and technical guidance on engineered quartz surfaces — from the Artizia team in Jaipur."
        canonical="https://artizia.co.in/blog.html"
      />
      <PageHero banner={PAGE.banner} />

      <section className="pad" style={{ paddingTop: 'clamp(28px,5vw,60px)' }}>
        <div className="wrap">
          <div className="tagbar" id="tagbar">
            {tags.length > 1 &&
              tags.map((t) => (
                <button key={t} className={t === tag ? 'on' : ''} data-t={t} onClick={() => { setTag(t); setPage(1) }}>
                  {t}
                </button>
              ))}
          </div>
          <div className="post-grid" id="posts">
            {shown.map((p, i) => (
              <Link className="pcardx rv" to={`/blog/${p.slug}`} key={p.slug}>
                <div className="pc-img" dangerouslySetInnerHTML={{ __html: coverHTML(p, start + i) }} />
                <div className="pc-body">
                  <span className="pc-date">
                    {fmtDate(p.publishedAt)}
                    {p.tags && p.tags.length ? ' · ' + p.tags[0] : ''}
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.excerpt || ''}</p>
                  <span className="pc-go">
                    Read <span className="arw">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <nav className="pager" id="pager" aria-label="Article pages" hidden={total < 2}>
            {total >= 2 && (
              <>
                <button className="pg-arw" disabled={curPage === 1} aria-label="Previous page" onClick={() => go(curPage - 1)}>←</button>
                {pageNumbers(total, curPage).map((n, i) =>
                  n === '…' ? (
                    <span className="pg-gap" key={'g' + i}>…</span>
                  ) : (
                    <button key={n} className={`pg-n${n === curPage ? ' on' : ''}`} aria-current={n === curPage ? 'page' : undefined} onClick={() => go(n)}>
                      {n}
                    </button>
                  ),
                )}
                <button className="pg-arw" disabled={curPage === total} aria-label="Next page" onClick={() => go(curPage + 1)}>→</button>
              </>
            )}
          </nav>
          <p className="mono" id="empty" hidden={!all || list.length > 0} style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '60px 0' }}>
            No articles published yet.
          </p>
        </div>
      </section>
    </>
  )
}
