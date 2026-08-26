import { useEffect, useRef } from 'react'
import Seo from '../components/Seo'
import { useBodyPage } from '../hooks/site'
import { loadScript } from '../lib/loadScript'
import home from '../generated/home.json'

/* The homepage is a 300vh cinematic experience (projective slab mapping, scroll-
   scrubbed process, looping sliders, world-map drill-down). Its markup, CSS and
   script are mounted verbatim behind the shared React chrome — guaranteeing exact
   pixel + animation parity — with map.js/worldmap.js loaded first and the
   legacyBridge providing the window.Artizia / window.ArtiziaData globals it expects. */
export default function Home() {
  useBodyPage('home')
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    let cancelled = false
    ;(async () => {
      await loadScript('/assets/js/map.js')
      await loadScript('/assets/js/worldmap.js')
      if (cancelled) return
      try {
        // eslint-disable-next-line no-new-func
        new Function(home.js)()
      } catch (e) {
        console.error('[home] init failed', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Seo
        title="Artizia — Quartz Slab Manufacturer & Exporter | Luxury Quartz Surfaces, India"
        description="Artizia is a quartz slab manufacturer and exporter crafting luxury quartz surfaces in Jaipur, India. Super jumbo quartz slabs, white quartz slabs and 53 designs across five collections — pressed on Breton technology, warranted for 15 years."
        canonical="https://artizia.co.in/"
        og={[
          ['og:title', 'Artizia — Quartz Slab Manufacturer & Exporter | Luxury Quartz Surfaces'],
          ['og:description', 'Super jumbo quartz slabs and luxury quartz surfaces, engineered in Jaipur and exported worldwide. Free samples, shipped across India in 5–7 days.'],
          ['og:type', 'website'],
        ]}
      />
      <style dangerouslySetInnerHTML={{ __html: home.css }} />
      <div dangerouslySetInnerHTML={{ __html: home.html }} />
    </>
  )
}
