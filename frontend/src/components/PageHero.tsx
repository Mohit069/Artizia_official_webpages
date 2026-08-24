import { VisualSlot } from '../lib/marble'

export interface Banner {
  image?: string
  alt?: string
  fallback?: string
  zoom?: number
  eyebrow?: string
  title?: string // may contain <em>
  lead?: string // may contain <em>
}

/* Mirrors app.js pageBanner(): eyebrow is text, title + lead are innerHTML,
   .ph-vis holds an <img> or a live marble canvas. */
export default function PageHero({ banner }: { banner: Banner }) {
  return (
    <section className="page-hero">
      <div className="ph-vis">
        <VisualSlot image={banner.image} alt={banner.alt} fallback={banner.fallback} zoom={banner.zoom} />
      </div>
      <div className="wrap">
        <span className="eyebrow">{banner.eyebrow}</span>
        <h1 dangerouslySetInnerHTML={{ __html: banner.title || '' }} />
        <p className="lead" dangerouslySetInnerHTML={{ __html: banner.lead || '' }} />
      </div>
    </section>
  )
}
