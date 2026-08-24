import { useEffect } from 'react'

/* counter animation, ported from app.js countUp() */
function countUp(st: HTMLElement) {
  const num = st.querySelector('.num') as HTMLElement | null
  if (!num) return
  const to = +(num.dataset.to || '0')
  const v = num.querySelector('.v') as HTMLElement | null
  if (!v) return
  if (window.MarbleGL?.reduce) {
    v.textContent = String(to)
    return
  }
  let s: number | null = null
  ;(function step(t: number) {
    if (s === null) s = t
    const p = Math.min((t - s) / 1500, 1),
      e = 1 - Math.pow(1 - p, 3)
    v.textContent = String(Math.round(to * e))
    if (p < 1) requestAnimationFrame(step)
  })(performance.now())
}

/* reveal-on-scroll + magnetic buttons — the global behaviours app.js runs on every page.
   A MutationObserver re-scans for async-rendered .rv / .mag nodes so dynamic content
   (product grids, blog cards, fetched sections) reveals exactly as before. */
export function useSiteEffects() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((en) => {
          const tall = en.boundingClientRect.height > innerHeight * 0.85
          if (en.isIntersecting && (tall || en.intersectionRatio >= 0.15)) {
            en.target.classList.add('in')
            if ((en.target as HTMLElement).matches('.stat')) countUp(en.target as HTMLElement)
            io.unobserve(en.target)
          }
        }),
      { threshold: [0, 0.15], rootMargin: '0px 0px -6% 0px' },
    )
    const scan = () => document.querySelectorAll('.rv:not(.in)').forEach((el) => io.observe(el))
    scan()
    const mo = new MutationObserver(() => scan())
    mo.observe(document.body, { childList: true, subtree: true })

    // magnetic buttons via delegation (covers dynamically added .mag elements)
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches
    const reduce = window.MarbleGL?.reduce
    let cur: HTMLElement | null = null
    const move = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('.mag') as HTMLElement | null
      if (el !== cur) {
        if (cur) cur.style.transform = ''
        cur = el
      }
      if (el) {
        const r = el.getBoundingClientRect()
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`
      }
    }
    if (fine && !reduce) addEventListener('mousemove', move)

    return () => {
      io.disconnect()
      mo.disconnect()
      if (fine && !reduce) removeEventListener('mousemove', move)
      if (cur) cur.style.transform = ''
    }
  }, [])
}

/* sets document.body[data-page], matching each current HTML page's <body data-page="…"> */
export function useBodyPage(page: string) {
  useEffect(() => {
    const prev = document.body.dataset.page
    document.body.dataset.page = page
    return () => {
      if (prev) document.body.dataset.page = prev
      else delete document.body.dataset.page
    }
  }, [page])
}
