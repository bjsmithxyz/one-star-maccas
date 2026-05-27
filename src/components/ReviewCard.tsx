import { Link } from 'react-router-dom'
import type { Review, Restaurant } from '../types'

type ReviewCardProps = {
  review: Review
  restaurant?: Restaurant
  showLocation?: boolean
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function ReviewCard({
  review,
  restaurant,
  showLocation = false,
}: ReviewCardProps) {
  const card = (
    <article className="group relative rounded-2xl border-2 border-mcd-charcoal/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-mcd-red/30 hover:shadow-lg sm:p-6">
      <span
        aria-hidden
        className="absolute -top-3 left-4 font-display text-5xl leading-none text-mcd-gold"
      >
        "
      </span>

      <div className="mb-3 flex items-center gap-1 text-mcd-red" aria-label="1 star rating">
        <span>★</span>
        <span className="text-mcd-charcoal/25">★★★★</span>
      </div>

      <p className="relative z-10 text-base leading-relaxed text-mcd-charcoal sm:text-lg">
        {review.text}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-mcd-charcoal/70">
        <span className="font-medium text-mcd-charcoal">{review.author}</span>
        <span aria-hidden>·</span>
        <time dateTime={review.date}>{formatDate(review.date)}</time>
      </div>

      {showLocation && restaurant && (
        <div className="mt-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-mcd-gold/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-mcd-charcoal">
            {restaurant.flag} {restaurant.city}, {restaurant.country}
          </span>
        </div>
      )}
    </article>
  )

  if (showLocation && restaurant) {
    return (
      <Link to={`/r/${restaurant.slug}`} className="block no-underline text-inherit">
        {card}
      </Link>
    )
  }

  return card
}
