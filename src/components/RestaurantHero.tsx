import type { Restaurant } from '../types'

type RestaurantHeroProps = {
  restaurant: Restaurant
  heroImage?: {
    url: string
    author: string
  }
}

export function RestaurantHero({ restaurant, heroImage }: RestaurantHeroProps) {
  return (
    <section className="overflow-hidden rounded-3xl border-4 border-mcd-charcoal bg-white shadow-[0_8px_0_#27251f]">
      <div className="relative min-h-[220px] sm:min-h-[260px]">
        {heroImage ? (
          <>
            <img
              src={heroImage.url}
              alt={`Photo from a 1-star review of ${restaurant.name}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-mcd-gold via-mcd-red to-mcd-charcoal" />
        )}

        <div className="relative flex h-full flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-mcd-gold">
              {restaurant.flag} {restaurant.city}, {restaurant.country}
            </p>
            <h1 className="font-display text-3xl leading-tight text-white sm:text-4xl">
              {restaurant.name}
            </h1>
            <p className="mt-2 text-white/80">
              Their finest 1-star masterpieces
            </p>
            {heroImage && (
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/60">
                Photo from a 1-star review by {heroImage.author}
              </p>
            )}
          </div>
        </div>
      </div>

      {restaurant.googleMapsUrl && (
        <div className="border-t border-mcd-charcoal/10 px-6 py-4 sm:px-8">
          <a
            href={restaurant.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-mcd-charcoal/15 px-4 py-2 text-sm font-semibold text-mcd-charcoal transition hover:border-mcd-red hover:text-mcd-red"
          >
            View on Google Maps ↗
          </a>
        </div>
      )}
    </section>
  )
}
