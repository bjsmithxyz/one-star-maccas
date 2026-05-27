import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SITE_NAME } from './constants/branding'
import { HomePage, NotFoundPage } from './pages/HomePage'
import { RestaurantPage } from './pages/RestaurantPage'

export default function App() {
  useEffect(() => {
    document.title = SITE_NAME
  }, [])

  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

  return (
    <BrowserRouter basename={basename || undefined}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/r/:slug" element={<RestaurantPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
