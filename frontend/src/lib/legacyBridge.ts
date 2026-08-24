/* Compatibility layer so the verbatim homepage/admin scripts (which expect the
   globals the old app.js exposed) run unchanged inside the React app.
   Reveal + magnetic are handled by the React useSiteEffects MutationObserver,
   so those shim methods are no-ops; the genuinely stateful helpers (initDrag,
   initManifesto, visual/marbleSlot) are ported verbatim from app.js. */

type Bridge = {
  addSample: (k: string, b?: any) => void
  openModal: (m: 'sample' | 'quote') => void
  openTray: () => void
  toast: (m: string) => void
}

let bridge: Bridge = { addSample: () => {}, openModal: () => {}, openTray: () => {}, toast: () => {} }
let resolveReady: (v: any) => void = () => {}

export function connectBridge(b: Bridge) {
  bridge = b
}
export function markReady(mat: any) {
  resolveReady(mat)
}

export function installLegacyGlobals() {
  const w = window as any
  if (w.__artiziaInstalled) return
  w.__artiziaInstalled = true

  w.addSample = (k: string, b?: any) => bridge.addSample(k, b)
  w.openModal = (m: 'sample' | 'quote') => bridge.openModal(m)
  w.openTray = () => bridge.openTray()
  w.toast = (m: string) => bridge.toast(m)
  w.ArtiziaData = { ready: new Promise((r) => (resolveReady = r)) }

  function marbleSlot(host: HTMLElement, matKey: string, zoom?: number) {
    if (!host || !w.MarbleGL) return null
    host.innerHTML = '<canvas></canvas>'
    const c = host.firstElementChild as HTMLCanvasElement
    const ctx = w.MarbleGL.makeGL(c)
    if (!ctx) return null
    const mat = (w.MAT || {})[matKey] || (w.MAT || {})[Object.keys(w.MAT || {})[0]]
    const t0 = performance.now()
    ;(function loop(now: number) {
      if (c.clientWidth) w.MarbleGL.draw(ctx, c, mat, (now - t0) / 1000, w.MarbleGL.dpr, zoom || 1.4)
      if (!w.MarbleGL.reduce) requestAnimationFrame(loop)
    })(t0)
    return ctx
  }
  function visual(host: HTMLElement, cfg: any) {
    if (!host || !cfg) return
    if (cfg.image) {
      host.innerHTML = `<img src="${cfg.image}" alt="${(cfg.alt || '').replace(/"/g, '&quot;')}" loading="lazy">`
      return
    }
    marbleSlot(host, cfg.fallback, cfg.zoom)
  }
  function initDrag(sel: any) {
    const g = (typeof sel === 'string' ? document.querySelector(sel) : sel) as any
    if (!g || g._d) return
    g._d = 1
    let down = false,
      sx = 0,
      sl = 0
    g.addEventListener('mousedown', (e: MouseEvent) => {
      down = true
      g.classList.add('dragging')
      sx = e.pageX
      sl = g.scrollLeft
    })
    addEventListener('mouseup', () => {
      down = false
      g.classList.remove('dragging')
    })
    g.addEventListener('mousemove', (e: MouseEvent) => {
      if (!down) return
      e.preventDefault()
      g.scrollLeft = sl - (e.pageX - sx) * 1.4
    })
  }
  function initManifesto(el: HTMLElement) {
    if (!el) return
    const html = el.innerHTML
    el.innerHTML = html.replace(/(<em>.*?<\/em>|[^\s<]+)/g, (m) => `<span class="w">${m}</span>`)
    new IntersectionObserver(
      (es) =>
        es.forEach((en) => {
          if (en.isIntersecting)
            en.target.querySelectorAll('.w').forEach((word, i) =>
              setTimeout(() => ((word as HTMLElement).style.opacity = word.querySelector('em') ? '1' : '.9'), i * 40),
            )
        }),
      { threshold: 0.4 },
    ).observe(el)
  }

  w.Artizia = {
    refresh: () => {},
    bindHover: () => {},
    bindMag: () => {},
    revealScan: () => {},
    initDrag,
    initManifesto,
    visual,
    marbleSlot,
    pageBanner: () => {},
    toast: (m: string) => bridge.toast(m),
    openModal: (m: 'sample' | 'quote') => bridge.openModal(m),
    addSample: (k: string, b?: any) => bridge.addSample(k, b),
    openTray: () => bridge.openTray(),
    get GL() {
      return w.MarbleGL
    },
    get MAT() {
      return w.MAT
    },
  }
}
