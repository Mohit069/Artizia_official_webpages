import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MAT as DEFAULT_MAT, type Material } from '../data/materials'
import { connectBridge, markReady } from '../lib/legacyBridge'

type ModalMode = 'sample' | 'quote' | null

interface Catalogue {
  configured: boolean
  url?: string
  name?: string
  type?: string
}

interface ArtiziaValue {
  mat: Record<string, Material>
  ready: boolean
  samples: string[]
  addSample: (key: string, btn?: HTMLElement | null) => void
  removeSample: (key: string) => void
  trayOpen: boolean
  openTray: () => void
  closeTray: () => void
  modalMode: ModalMode
  openModal: (mode: 'sample' | 'quote') => void
  closeModal: () => void
  searchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toast: (msg: string) => void
  toastMsg: string
  catalogue: Catalogue | null
}

const Ctx = createContext<ArtiziaValue | null>(null)

export const useArtizia = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useArtizia must be used within ArtiziaProvider')
  return v
}

const reduce =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion:reduce)').matches

export function ArtiziaProvider({ children }: { children: ReactNode }) {
  const [mat, setMat] = useState<Record<string, Material>>(() => ({ ...DEFAULT_MAT }))
  const [ready, setReady] = useState(false)
  const [samples, setSamples] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('artizia_samples') || '[]')
    } catch {
      return []
    }
  })
  const [trayOpen, setTrayOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  /* ---- hydrate MAT from the backend, exactly like app.js ---- */
  useEffect(() => {
    // window.MAT is the source of truth for the vendor marble engine; keep it in sync.
    window.MAT = { ...DEFAULT_MAT }
    fetch('/api/products', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Material[]) => {
        if (Array.isArray(list) && list.length) {
          const next: Record<string, Material> = {}
          // keep hidden built-ins (e.g. the hero material), replace the rest with live data
          Object.keys(DEFAULT_MAT).forEach((k) => {
            if (DEFAULT_MAT[k].hidden) next[k] = DEFAULT_MAT[k]
          })
          list.forEach((p) => {
            next[(p as any).slug] = p
          })
          window.MAT = next
          setMat(next)
        }
      })
      .catch(() => {})
      .finally(() => {
        setReady(true)
        markReady(window.MAT) // resolves window.ArtiziaData.ready for the legacy home script
      })
  }, [])

  /* ---- catalogue sticky tab ---- */
  useEffect(() => {
    fetch('/api/catalogue', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c && c.configured && setCatalogue(c))
      .catch(() => {})
  }, [])

  const persist = (next: string[]) => {
    try {
      localStorage.setItem('artizia_samples', JSON.stringify(next))
    } catch {}
  }

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 2200)
  }, [])

  const openTray = useCallback(() => setTrayOpen(true), [])
  const closeTray = useCallback(() => setTrayOpen(false), [])

  const addSample = useCallback(
    (key: string, _btn?: HTMLElement | null) => {
      const M = window.MAT || {}
      if (!M[key]) return
      setSamples((prev) => {
        if (prev.includes(key)) {
          setTrayOpen(true)
          toast(M[key].name + ' is already in your set')
          return prev
        }
        if (prev.length >= 4) {
          setTrayOpen(true)
          toast('Sample set is full — max 4')
          return prev
        }
        const next = [...prev, key]
        persist(next)
        setTrayOpen(true)
        return next
      })
    },
    [toast],
  )

  const removeSample = useCallback((key: string) => {
    setSamples((prev) => {
      const next = prev.filter((x) => x !== key)
      persist(next)
      return next
    })
  }, [])

  const openModal = useCallback((mode: 'sample' | 'quote') => setModalMode(mode), [])
  const closeModal = useCallback(() => setModalMode(null), [])
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  /* keyboard: Esc closes overlays; Cmd/Ctrl-K and "/" open search (parity with app.js) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setModalMode(null)
        setTrayOpen(false)
        return
      }
      const t = e.target as HTMLElement
      const typing =
        /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName || '') || t?.isContentEditable
      if (
        ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey)
      ) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* wire the legacy-script compat bridge to the real context actions */
  useEffect(() => {
    connectBridge({ addSample, openModal, openTray, toast })
  }, [addSample, openModal, openTray, toast])

  const value = useMemo<ArtiziaValue>(
    () => ({
      mat,
      ready,
      samples,
      addSample,
      removeSample,
      trayOpen,
      openTray,
      closeTray,
      modalMode,
      openModal,
      closeModal,
      searchOpen,
      openSearch,
      closeSearch,
      toast,
      toastMsg,
      catalogue,
    }),
    [
      mat,
      ready,
      samples,
      addSample,
      removeSample,
      trayOpen,
      openTray,
      closeTray,
      modalMode,
      openModal,
      closeModal,
      searchOpen,
      openSearch,
      closeSearch,
      toast,
      toastMsg,
      catalogue,
    ],
  )

  // expose reduced-motion for children that need it (menu focus timing etc.)
  ;(value as any)._reduce = reduce

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
