import L from 'leaflet'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import type { Restaurant } from '../types'
import 'leaflet/dist/leaflet.css'

type RestaurantMapProps = {
  restaurants: Restaurant[]
}

function pinIcon(reviewCount: number) {
  return L.divIcon({
    className: '',
    html: `<div class="mcd-map-pin"><span>${reviewCount}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
  })
}

export function RestaurantMap({ restaurants }: RestaurantMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={18}
      scrollWheelZoom
      className="h-[min(70vh,640px)] w-full rounded-2xl border-2 border-mcd-charcoal/10 shadow-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.slug}
          position={[restaurant.lat!, restaurant.lng!]}
          icon={pinIcon(restaurant.reviews.length)}
        >
          <Popup>
            <div className="min-w-[180px] font-body text-sm text-mcd-charcoal">
              <p className="text-lg leading-none">
                {restaurant.flag}{' '}
                <span className="font-semibold">{restaurant.city}</span>
              </p>
              <p className="mt-1 text-mcd-charcoal/70">{restaurant.name}</p>
              <p className="mt-2 font-semibold text-mcd-red">
                {restaurant.reviews.length} one-star review
                {restaurant.reviews.length === 1 ? '' : 's'}
              </p>
              <Link
                to={`/r/${restaurant.slug}`}
                className="mt-3 inline-block font-semibold text-mcd-charcoal underline decoration-mcd-gold decoration-2 underline-offset-2 hover:text-mcd-red"
              >
                Read reviews →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
