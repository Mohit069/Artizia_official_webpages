import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Admin from './pages/Admin'
import About from './pages/About'
import Warranty from './pages/Warranty'
import Care from './pages/Care'
import Technical from './pages/Technical'
import Certifications from './pages/Certifications'
import Faq from './pages/Faq'
import Contact from './pages/Contact'
import Dealer from './pages/Dealer'
import Catalogue from './pages/Catalogue'
import Collections from './pages/Collections'
import Product from './pages/Product'
import Blog from './pages/Blog'
import Post from './pages/Post'
import CmsPage from './pages/CmsPage'
import { productPath, collectionPath } from './data/schema'

/* The addresses these pages had before the move to /quartz/<name> and
   /collections/<name>. A cold visit gets a 301 from Express; this covers a link
   followed inside the app, and anything still pointing at the old form. */
function OldProductUrl() {
  const [params] = useSearchParams()
  const p = params.get('p') || ''
  return <Navigate replace to={p ? productPath(p) : '/collections'} />
}
function OldCollectionsUrl() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  return <Navigate replace to={collectionPath(params.get('c')) + (q ? '?q=' + encodeURIComponent(q) : '')} />
}

/* Every current URL is preserved. Extensionless aliases (/about) resolve to the
   same page as the canonical .html URL, matching Express's `extensions:['html']`. */
export default function App() {
  return (
    <Routes>
      {/* Admin has no marketing chrome — its own bare route */}
      <Route path="/admin.html" element={<Admin />} />
      <Route path="/admin" element={<Admin />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/index.html" element={<Home />} />

        <Route path="/about.html" element={<About />} />
        <Route path="/about" element={<About />} />

        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:coll" element={<Collections />} />
        <Route path="/collections.html" element={<OldCollectionsUrl />} />

        <Route path="/quartz/:slug" element={<Product />} />
        <Route path="/product.html" element={<OldProductUrl />} />
        <Route path="/product" element={<OldProductUrl />} />

        <Route path="/certifications.html" element={<Certifications />} />
        <Route path="/certifications" element={<Certifications />} />

        <Route path="/technical-details.html" element={<Technical />} />
        <Route path="/technical-details" element={<Technical />} />

        <Route path="/warranty.html" element={<Warranty />} />
        <Route path="/warranty" element={<Warranty />} />

        <Route path="/care-and-maintenance.html" element={<Care />} />
        <Route path="/care-and-maintenance" element={<Care />} />

        <Route path="/faq.html" element={<Faq />} />
        <Route path="/faq" element={<Faq />} />

        <Route path="/contact.html" element={<Contact />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/become-a-dealer.html" element={<Dealer />} />
        <Route path="/become-a-dealer" element={<Dealer />} />

        <Route path="/catalogue.html" element={<Catalogue />} />
        <Route path="/catalogue" element={<Catalogue />} />

        <Route path="/blog.html" element={<Blog />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<Post />} />
        <Route path="/post.html" element={<Post />} />

        <Route path="/p/:slug" element={<CmsPage />} />
        <Route path="/page.html" element={<CmsPage />} />

        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
