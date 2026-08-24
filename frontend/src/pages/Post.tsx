import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { useBodyPage } from '../hooks/site'

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

interface PostData {
  slug: string
  title: string
  body?: string
  excerpt?: string
  cover?: string
  author?: string
  tags?: string[]
  publishedAt?: string
  seoTitle?: string
  seoDesc?: string
}

export default function Post() {
  useBodyPage('post')
  const routeParams = useParams()
  const [params] = useSearchParams()
  const slug = routeParams.slug || params.get('p') || ''
  const [post, setPost] = useState<PostData | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let live = true
    setPost(null)
    setNotFound(false)
    fetch('/api/posts/' + encodeURIComponent(slug))
      .then((r) => {
        if (!r.ok) throw new Error('404')
        return r.json()
      })
      .then((p: PostData) => {
        if (live) setPost(p)
      })
      .catch(() => {
        if (live) setNotFound(true)
      })
    return () => {
      live = false
    }
  }, [slug])

  if (notFound) {
    return (
      <>
        <Seo title="Not found — Artizia" />
        <section className="pad" id="notFound">
          <div className="wrap" style={{ textAlign: 'center' }}>
            <span className="eyebrow center">404</span>
            <h1 style={{ fontSize: 'clamp(34px,6vw,72px)', margin: '20px 0' }}>
              Article <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>not found.</em>
            </h1>
            <p style={{ color: 'var(--text-dim)', marginBottom: 30 }}>That article has moved or was never published.</p>
            <Link className="btn btn-fill mag" to="/blog"><span>The Journal <span className="arw">→</span></span></Link>
          </div>
        </section>
      </>
    )
  }

  if (!post) return null

  const p = post
  const when = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const metaBits = [when, p.author ? 'By ' + esc(p.author) : '', ...(p.tags || []).map(esc)].filter(Boolean)
  const origin = typeof location !== 'undefined' ? location.origin : ''

  const og: [string, string][] = [
    ['og:title', p.seoTitle || p.title],
    ['og:description', p.seoDesc || p.excerpt || ''],
    ['og:type', 'article'],
  ]
  if (p.cover) og.push(['og:image', origin + p.cover])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.seoDesc || p.excerpt || '',
    datePublished: p.publishedAt || undefined,
    author: p.author ? { '@type': 'Person', name: p.author } : { '@type': 'Organization', name: 'Artizia' },
    publisher: { '@type': 'Organization', name: 'Artizia', logo: { '@type': 'ImageObject', url: origin + '/assets/img/brand/logo-full.png' } },
    image: p.cover ? origin + p.cover : undefined,
  }

  return (
    <>
      <Seo title={(p.seoTitle || p.title) + ' — Artizia'} description={p.seoDesc || p.excerpt || ''} og={og} jsonLd={jsonLd} />
      <article id="post">
        <header className="art-hero">
          <div className="art-cover" id="cover">
            {p.cover && <img src={p.cover} alt={p.title} fetchPriority="high" />}
          </div>
          <div className="wrap">
            <Link className="art-back mag" to="/blog">← The Journal</Link>
            <div className="art-meta" id="meta">
              {metaBits.map((x, i) => (
                <span key={i}>{x}</span>
              ))}
            </div>
            <h1 id="title">{p.title}</h1>
          </div>
        </header>

        <div className="pad" style={{ paddingTop: 'clamp(30px,5vw,60px)' }}>
          <div className="wrap">
            <div className="prose-long rv" id="body" dangerouslySetInnerHTML={{ __html: p.body || '' }} />
            <div className="art-foot rv">
              <Link className="btn btn-line mag" to="/blog"><span>← All Articles</span></Link>
              <Link className="btn btn-fill mag" to="/contact.html"><span>Talk to Our Team <span className="arw">→</span></span></Link>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
