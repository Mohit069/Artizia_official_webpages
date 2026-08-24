import { useEffect, useRef } from 'react'
import Seo from '../components/Seo'
import { useBodyPage } from '../hooks/site'
import { loadScript } from '../lib/loadScript'
import admin from '../generated/admin.json'

/* The admin CMS (login, product/page/post/enquiry/user tabs, canvas crop tool,
   rich-text editor, inline page-editor helpers) is a self-contained 1,800-line
   app. It is mounted verbatim so every feature keeps working exactly as before —
   blocks.js (page-block engine) is loaded first; marble.js + the data globals are
   already present from index.html / main.tsx. It renders bare (no marketing chrome),
   matching admin.html. */
export default function Admin() {
  useBodyPage('admin')
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    let cancelled = false
    ;(async () => {
      await loadScript('/assets/js/blocks.js')
      if (cancelled) return
      try {
        // eslint-disable-next-line no-new-func
        new Function(admin.js)()
      } catch (e) {
        console.error('[admin] init failed', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Seo title="Admin — Artizia" robots="noindex" />
      <style dangerouslySetInnerHTML={{ __html: admin.css }} />
      <div dangerouslySetInnerHTML={{ __html: admin.html }} />
    </>
  )
}
