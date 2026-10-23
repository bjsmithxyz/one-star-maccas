import { useMemo } from 'react'
import type { Restaurant } from '../types'
import { getRandomReviewWithImage } from '../data/hero'
import { getReviewImageUrl, getSafeGoogleMapsUrl, getSafeImageUrl } from '../data'
import { formatAuthorInitials } from '../lib/author'
import { SafeExternalLink } from './SafeExternalLink'

type RestaurantHeroProps = {
  restaurant: Restaurant
}

export function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  const reviewOverlay = useMemo(
    () => getRandomReviewWithImage(restaurant),
    [restaurant],
  )
  const placeImageUrl = getSafeImageUrl(restaurant.imageUrl)
  const overlayImageUrl = reviewOverlay
    ? getReviewImageUrl(reviewOverlay)
    : ''
  const googleMapsUrl = getSafeGoogleMapsUrl(restaurant)
  const authorLabel = reviewOverlay
    ? formatAuthorInitials(reviewOverlay.author)
    : 'reviewer'

  return (
    <section className="overflow-hidden rounded-2xl border border-mcd-charcoal/10 bg-white shadow-sm">
      <div className="relative min-h-[240px] sm:min-h-[280px]">
        {placeImageUrl ? (
          <img
            src={placeImageUrl}
            alt={`${restaurant.name} exterior`}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-mcd-gold via-mcd-red to-mcd-charcoal" />
        )}

        {overlayImageUrl && (
          <img
            src={overlayImageUrl}
            alt={`Photo from a 1-star review by ${authorLabel}`}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/35" />

        <div className="relative flex h-full flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-mcd-gold">
              {restaurant.flag} {restaurant.city}, {restaurant.country}
            </p>
            <h1 className="font-display text-3xl leading-tight text-white sm:text-4xl">
              {restaurant.name}
            </h1>
            {overlayImageUrl && (
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/60">
                Review photo by {authorLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      {googleMapsUrl && (
        <div className="border-t border-mcd-charcoal/10 px-6 py-4 sm:px-8">
          <SafeExternalLink
            href={googleMapsUrl}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-mcd-charcoal/70 transition hover:bg-mcd-charcoal/5 hover:text-mcd-red"
          >
            View on Google Maps ↗
          </SafeExternalLink>
        </div>
      )}
    </section>
  )
}
