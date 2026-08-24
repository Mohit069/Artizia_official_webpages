import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ArtiziaProvider } from './context/ArtiziaContext'
import { MAT, COLLECTIONS, SPECS, CERTS, FAQS } from './data/materials'
import { SITE } from './data/site'
import { installLegacyGlobals } from './lib/legacyBridge'

/* Bridge the ported site data onto window for the verbatim vendor scripts
   (marble.js reads window.MAT; the homepage script reads window.COLLECTIONS,
   window.productList, etc.). The context keeps window.MAT in sync with live
   /api/products data thereafter. Installed BEFORE render so the legacy home/
   admin scripts find every global they expect. */
const w = window as any
w.MAT = { ...MAT }
w.SITE = SITE
w.COLLECTIONS = COLLECTIONS
w.SPECS = SPECS
w.CERTS = CERTS
w.FAQS = FAQS
w.productList = () => Object.keys(w.MAT).filter((k: string) => !w.MAT[k].hidden)
installLegacyGlobals()

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ArtiziaProvider>
      <App />
    </ArtiziaProvider>
  </BrowserRouter>,
)
