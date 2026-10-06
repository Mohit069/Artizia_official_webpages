import { useEffect, useRef } from 'react'
import Seo from '../components/Seo'
import { useBodyPage } from '../hooks/site'
import { loadScript } from '../lib/loadScript'
import home from '../generated/home.json'
import { graph, webPage, SHARE_IMAGE } from '../data/schema'

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
        title="Premium Quartz Manufacturer and Quartz Exporter in India | Artizia Quartz Masterpieces"
        description="Artizia is a premium quartz manufacturer and quartz exporter in India offering engineered quartz slabs, Jumbo quartz surfaces and premium designs for residential, commercial and hospitality projects."
        canonical="https://artizia.co.in/"
        og={[
          ['og:title', 'Premium Quartz Manufacturer and Quartz Exporter in India | Artizia Quartz Masterpieces'],
          ['og:description', 'Artizia is a premium quartz manufacturer and quartz exporter in India offering engineered quartz slabs, Jumbo quartz surfaces and premium designs for residential, commercial and hospitality projects.'],
          ['og:type', 'website'],
          ['og:site_name', 'Artizia'],
          ['og:url', 'https://artizia.co.in/'],
          ['og:image', SHARE_IMAGE],
          ['og:image:width', '1200'],
          ['og:image:height', '630'],
          ['og:image:alt', 'An Artizia engineered quartz slab'],
          ['twitter:card', 'summary_large_image'],
        ]}
        jsonLd={graph(webPage('WebPage', '/', 'Premium Quartz Manufacturer and Quartz Exporter in India | Artizia Quartz Masterpieces',
          'Artizia is a premium quartz manufacturer and quartz exporter in India offering engineered quartz slabs, Jumbo quartz surfaces and premium designs for residential, commercial and hospitality projects.'))}
      />
      <style dangerouslySetInnerHTML={{ __html: home.css }} />
      <div dangerouslySetInnerHTML={{ __html: home.html }} />
    </>
  )
}
