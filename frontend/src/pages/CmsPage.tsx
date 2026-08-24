import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { useBodyPage } from '../hooks/site'
import { loadScript } from '../lib/loadScript'

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

interface PageData {
  slug: string
  title: string
  sections?: any[]
  seoTitle?: string
  seoDesc?: string
  ogImage?: string
}

export default function CmsPage() {
  useBodyPage('dynamic')
  const routeParams = useParams()
  const [params] = useSearchParams()
  const slug = routeParams.slug || params.get('p') || ''
  const blocksRef = useRef<HTMLElement>(null)
  const [page, setPage] = useState<PageData | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let live = true
    setPage(null)
    setNotFound(false)
    Promise.all([loadScript('/assets/js/blocks.js'), fetch('/api/pages/' + encodeURIComponent(slug)).then((r) => { if (!r.ok) throw new Error('404'); return r.json() })])
      .then(([, p]: [void, PageData]) => {
        if (!live) return
        setPage(p)
        // render blocks imperatively (same engine the admin editor uses)
        const host = blocksRef.current
        if (host && (window as any).renderBlocks) {
          host.innerHTML = (window as any).renderBlocks(p.sections)
          hydrate(host)
        }
      })
      .catch(() => {
        if (live) setNotFound(true)
      })
    return () => {
      live = false
    }
  }, [slug])

  async function hydrate(root: HTMLElement) {
    const host = root.querySelector('[data-posts]') as HTMLElement | null
    if (!host) return
    try {
      const posts = await (await fetch('/api/posts?limit=' + (+(host.dataset.posts || 3) || 3))).json()
      host.innerHTML = posts.length
        ? posts
            .map(
              (p: any) => `<a class="pcardx" href="/blog/${esc(p.slug)}">
              <div class="pc-img">${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">` : ''}</div>
              <div class="pc-body">
                <span class="pc-date">${p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.excerpt || '')}</p>
              </div></a>`,
            )
            .join('')
        : '<p class="mono" style="color:var(--text-faint)">No articles published yet.</p>'
    } catch {
      host.remove()
    }
  }

  const origin = typeof location !== 'undefined' ? location.origin : ''
  const og: [string, string][] = page
    ? [
        ['og:title', page.seoTitle || page.title],
        ['og:description', page.seoDesc || ''],
        ...(page.ogImage ? ([['og:image', origin + page.ogImage]] as [string, string][]) : []),
      ]
    : []

  return (
    <>
      {page && <Seo title={(page.seoTitle || page.title) + ' — Artizia'} description={page.seoDesc || ''} og={og} />}
      {notFound && <Seo title="Not found — Artizia" />}
      <main id="blocks" ref={blocksRef} />
      {notFound && (
        <section className="pad" id="notFound">
          <div className="wrap" style={{ textAlign: 'center' }}>
            <span className="eyebrow center">404</span>
            <h1 style={{ fontSize: 'clamp(34px,6vw,72px)', margin: '20px 0' }}>
              Page <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>not found.</em>
            </h1>
            <p style={{ color: 'var(--text-dim)', marginBottom: 30 }}>That page has moved or was never published.</p>
            <Link className="btn btn-fill mag" to="/index.html"><span>Back Home <span className="arw">→</span></span></Link>
          </div>
        </section>
      )}
    </>
  )
}
