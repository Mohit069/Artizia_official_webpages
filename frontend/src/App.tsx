import { Routes, Route } from 'react-router-dom'
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
import Collections from './pages/Collections'
import Product from './pages/Product'
import Blog from './pages/Blog'
import Post from './pages/Post'
import CmsPage from './pages/CmsPage'

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

        <Route path="/collections.html" element={<Collections />} />
        <Route path="/collections" element={<Collections />} />

        <Route path="/product.html" element={<Product />} />

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
