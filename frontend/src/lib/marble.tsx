/* React-side helpers over the browser global window.MarbleGL (assets/js/marble.js).
   The engine is unchanged; we only call into it. Photo-or-marble fallback logic
   mirrors app.js `visual()` / `marbleSlot()`. */
import { useEffect, useRef } from 'react'

export const imgForHTML = (key: string, slot = 0, seedShift = 0): string =>
  window.MarbleGL ? window.MarbleGL.imgFor(key, slot, seedShift) : ''

export const firstPhoto = (key: string): string | null =>
  window.MarbleGL ? window.MarbleGL.firstPhoto(key) : null

/* A visual slot: an uploaded/explicit <img> when given, otherwise a live marble
   canvas so a slot is never an empty box (identical to app.js behaviour). */
export function VisualSlot({
  image,
  alt,
  fallback,
  zoom,
  className,
}: {
  image?: string
  alt?: string
  fallback?: string
  zoom?: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (image) return
    const c = ref.current
    const GL = window.MarbleGL
    if (!c || !GL) return
    const ctx = GL.makeGL(c)
    if (!ctx) return
    const MAT = window.MAT || {}
    const mat = MAT[fallback || ''] || MAT[Object.keys(MAT)[0]]
    const t0 = performance.now()
    let raf = 0
    ;(function loop(now: number) {
      if (c.clientWidth) GL.draw(ctx, c, mat, (now - t0) / 1000, GL.dpr, zoom || 1.4)
      if (!GL.reduce) raf = requestAnimationFrame(loop)
    })(t0)
    return () => cancelAnimationFrame(raf)
  }, [image, fallback, zoom])

  if (image)
    return <img className={className} src={image} alt={alt || ''} loading="lazy" />
  return (
    <canvas
      className={className}
      ref={ref}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
