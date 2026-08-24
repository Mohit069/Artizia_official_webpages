import { useEffect, useRef } from 'react'
import { useArtizia } from '../../context/ArtiziaContext'

const HOVER_SEL = 'a,button,summary,input,select,textarea,.gcard,.pcard,.pair,.pth,.why-row'

export function Toast() {
  const { toastMsg } = useArtizia()
  return (
    <div
      id="toast"
      style={{
        opacity: toastMsg ? 1 : 0,
        transform: toastMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(40px)',
      }}
    >
      {toastMsg}
    </div>
  )
}

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches
    const reduce = window.MarbleGL?.reduce
    if (!fine || reduce) {
      if (dot.current) dot.current.style.display = 'none'
      if (ring.current) ring.current.style.display = 'none'
      return
    }
    let mx = innerWidth / 2,
      my = innerHeight / 2,
      rx = mx,
      ry = my,
      raf = 0
    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (dot.current) {
        dot.current.style.left = mx + 'px'
        dot.current.style.top = my + 'px'
      }
    }
    const loop = () => {
      rx += (mx - rx) * 0.16
      ry += (my - ry) * 0.16
      if (ring.current) {
        ring.current.style.left = rx + 'px'
        ring.current.style.top = ry + 'px'
      }
      raf = requestAnimationFrame(loop)
    }
    const over = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.(HOVER_SEL)) document.body.classList.add('hovering')
    }
    const out = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.(HOVER_SEL)) document.body.classList.remove('hovering')
    }
    addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)
    loop()
    return () => {
      removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', out)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <>
      <div className="cursor" id="cursor" ref={dot} />
      <div className="cursor-ring" id="cursorRing" ref={ring} />
    </>
  )
}

export function CatalogueTab() {
  const { catalogue } = useArtizia()
  if (!catalogue || !catalogue.configured || !catalogue.url) return null
  const isPdf = catalogue.type === 'pdf'
  return (
    <a
      className="cat-tab mag"
      href={catalogue.url}
      target="_blank"
      rel="noopener"
      {...(!isPdf ? { download: catalogue.name || 'artizia-catalogue' } : {})}
      aria-label={'Open the Artizia catalogue' + (isPdf ? ' (PDF)' : '')}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H15l5 5v12.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20.5z" />
        <path d="M14 3v6h6" />
        <path d="M8 13h8M8 17h5" />
      </svg>
      <span>Catalogue</span>
    </a>
  )
}
