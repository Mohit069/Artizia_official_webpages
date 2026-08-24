import { useEffect } from 'react'

export interface SeoProps {
  title?: string
  description?: string
  canonical?: string
  robots?: string
  og?: [string, string][]
  jsonLd?: object | object[]
}

/* Runtime head management for the SPA (mirrors each page's current static <head>).
   The SSG/prerender phase will additionally bake these into the emitted HTML so
   crawlers see them without executing JS — preserving today's SEO exactly. */
export default function Seo({ title, description, canonical, robots, og, jsonLd }: SeoProps) {
  useEffect(() => {
    if (title) document.title = title
    // wipe previously-managed tags, then re-add for this page
    document.querySelectorAll('[data-seo]').forEach((n) => n.remove())

    const add = (el: HTMLElement) => {
      el.setAttribute('data-seo', '')
      document.head.appendChild(el)
    }
    const meta = (attr: 'name' | 'property', key: string, content?: string) => {
      if (!content) return
      const m = document.createElement('meta')
      m.setAttribute(attr, key)
      m.setAttribute('content', content)
      add(m)
    }
    if (description) meta('name', 'description', description)
    if (robots) meta('name', 'robots', robots)
    if (canonical) {
      const l = document.createElement('link')
      l.setAttribute('rel', 'canonical')
      l.setAttribute('href', canonical)
      add(l)
    }
    ;(og || []).forEach(([p, c]) => meta('property', p, c))
    if (jsonLd) {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(jsonLd)
      add(s)
    }
  }, [title, description, canonical, robots, JSON.stringify(og), JSON.stringify(jsonLd)])

  return null
}
