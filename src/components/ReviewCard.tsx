import { Link } from 'react-router-dom'
import { getReviewImageUrl } from '../data'
import { formatAuthorInitials } from '../lib/author'
import { SafeExternalLink } from './SafeExternalLink'
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
  const imageUrl = getReviewImageUrl(review)

  const authorLabel = formatAuthorInitials(review.author)

  return (
    <article
      id={review.id}
      className="group relative scroll-mt-24 rounded-2xl border border-mcd-charcoal/10 bg-white shadow-sm transition hover:border-mcd-red/25 hover:shadow-md content-visibility-auto"
    >
      {imageUrl && (
        <div className="overflow-hidden rounded-t-2xl">
          <img
            src={imageUrl}
            alt={`Photo from ${authorLabel}'s review`}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}

      <div className="relative px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-mcd-red" aria-label="1 star rating">
          <span aria-hidden>★</span>
          <span>1 star</span>
        </div>

        <p className="relative z-10 text-base leading-relaxed text-mcd-charcoal sm:text-lg">
          {review.text}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-mcd-charcoal/70">
          <span className="font-medium text-mcd-charcoal">{authorLabel}</span>
          <span aria-hidden>·</span>
          <time dateTime={review.date}>{formatDate(review.date)}</time>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-mcd-charcoal/8 pt-4">
          {showLocation && restaurant && (
            <Link
              to={`/r/${restaurant.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-mcd-gold/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-mcd-charcoal transition hover:bg-mcd-gold/50"
            >
              {restaurant.flag} {restaurant.city}, {restaurant.country}
            </Link>
          )}

          {sourceUrl && (
            <SafeExternalLink
              href={sourceUrl}
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-mcd-red transition hover:text-mcd-charcoal"
            >
              View live review ↗
            </SafeExternalLink>
          )}
        </div>

      </div>
    </article>
  )
}
