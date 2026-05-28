import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SITE_NAME } from './constants/branding'
import { HomePage, NotFoundPage } from './pages/HomePage'
import { RestaurantPage } from './pages/RestaurantPage'

const MapPage = lazy(() =>
  import('./pages/MapPage').then((module) => ({ default: module.MapPage })),
)

function MapPageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="font-display text-lg text-mcd-charcoal/70">Loading map…</p>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    document.title = SITE_NAME
  }, [])

  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

  return (
    <BrowserRouter basename={basename || undefined}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/map"
          element={
            <Suspense fallback={<MapPageFallback />}>
              <MapPage />
            </Suspense>
          }
        />
        <Route path="/r/:slug" element={<RestaurantPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
