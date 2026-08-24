import { Outlet } from 'react-router-dom'
import Nav from './Nav'
import Footer from './Footer'
import SampleTray from './chrome/SampleTray'
import RequestModal from './chrome/RequestModal'
import SearchOverlay from './chrome/SearchOverlay'
import { Toast, Cursor, CatalogueTab } from './chrome/Overlays'
import { useSiteEffects } from '../hooks/site'

export default function Layout() {
  useSiteEffects()
  return (
    <>
      <Nav />
      <Outlet />
      <Footer />
      {/* global chrome overlays (position:fixed) */}
      <SampleTray />
      <RequestModal />
      <SearchOverlay />
      <Toast />
      <Cursor />
      <CatalogueTab />
    </>
  )
}
