import { useNavigate, useLocation } from 'react-router-dom'
import { useArtizia } from '../../context/ArtiziaContext'

function slotSrc(key: string): string {
  const m = (window.MAT || {})[key] || {}
  const photo = (m.images || []).find(Boolean)
  if (photo) return photo
  return window.MarbleGL ? window.MarbleGL.marbleImg(key, 0) : ''
}

export default function SampleTray() {
  const { samples, trayOpen, closeTray, removeSample, openModal, mat } = useArtizia()
  const nav = useNavigate()
  const loc = useLocation()

  const onAdd = (e: React.MouseEvent) => {
    const grid = document.getElementById('grid')
    if (loc.pathname.includes('collections') && grid) {
      e.preventDefault()
      closeTray()
      grid.scrollIntoView({
        behavior: window.MarbleGL?.reduce ? 'auto' : 'smooth',
        block: 'start',
      })
    } else {
      e.preventDefault()
      closeTray()
      nav('/collections.html')
    }
  }

  return (
    <div
      className={`tray${trayOpen ? ' open' : ''}`}
      id="tray"
      role="region"
      aria-label="Sample tray"
    >
      <div className="tin">
        <div className="ttl">
          Your Sample Set ·{' '}
          <b>
            <span id="tn">{samples.length}</span>/4
          </b>
        </div>
        <div className="tslots" id="tslots">
          {Array.from({ length: 4 }).map((_, i) => {
            const k = samples[i]
            const m = k && mat[k]
            if (k) {
              return (
                <div className="slot on" key={i}>
                  <img src={slotSrc(k)} alt={m ? m.name : k} loading="lazy" />
                  <span className="sn">{m ? m.name : k}</span>
                  <button
                    className="rm"
                    aria-label="Remove"
                    onClick={() => removeSample(k)}
                  >
                    ✕
                  </button>
                </div>
              )
            }
            return (
              <a
                className="slot add"
                href="/collections.html"
                key={i}
                aria-label="Add a surface — browse the collections"
                title="Browse collections to add a surface"
                onClick={onAdd}
              >
                <span aria-hidden="true">+</span>
              </a>
            )
          })}
        </div>
        <div className="tact">
          <button className="btn btn-fill mag" id="traySubmit" onClick={() => openModal('sample')}>
            <span>
              Request Samples <span className="arw">→</span>
            </span>
          </button>
          <button className="tclose" aria-label="Close" onClick={closeTray}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
