import { Link } from 'react-router-dom'
import { ReviewReactions } from './ReviewReactions'
import type { Review, Restaurant } from '../types'

type ReviewCardProps = {
  review: Review
  restaurant?: Restaurant
  showLocation?: boolean
  sourceUrl: string
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
  sourceUrl,
}: ReviewCardProps) {
  return (
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {showLocation && restaurant && (
          <Link
            to={`/r/${restaurant.slug}`}
            className="inline-flex items-center gap-1 rounded-full bg-mcd-gold/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-mcd-charcoal transition hover:bg-mcd-gold/50"
          >
            {restaurant.flag} {restaurant.city}, {restaurant.country}
          </Link>
        )}

        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-mcd-red transition hover:text-mcd-charcoal"
          >
            View live review ↗
          </a>
        )}
      </div>

      <ReviewReactions reviewId={review.id} />
    </article>
  )
}
