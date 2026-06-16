import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClownEmoji } from './ClownEmoji'
import { getReviewById, getReviewImageUrl, getSafeImageUrl } from '../data'
import {
  fetchTopReactedReviews,
  isSupabaseConfigured,
  type TopReactedReview,
} from '../lib/supabase'
import { hasMoreAfterLeaderboardPreview, leaderboardPreview } from '../lib/text'
import { formatAuthorInitials } from '../lib/author'

const RANK_LABELS = ['🥇', '🥈', '🥉']

type LeaderboardEntry = TopReactedReview & {
  reviewText: string
  author: string
  restaurantSlug: string
  restaurantLabel: string
  imageUrl: string
  placeImageUrl: string
}

function LeaderboardImage({
  reviewImageUrl,
  placeImageUrl,
  author,
}: {
  reviewImageUrl: string
  placeImageUrl: string
  author: string
}) {
  const src = reviewImageUrl || placeImageUrl
  const authorLabel = formatAuthorInitials(author)

  if (src) {
    return (
      <img
        src={src}
        alt={reviewImageUrl ? `Photo from ${authorLabel}'s review` : ''}
        className={`aspect-[2/1] w-full object-cover ${reviewImageUrl ? '' : 'opacity-90'}`}
      />
    )
  }

  return (
    <div
      aria-hidden
      className="flex aspect-[2/1] w-full items-center justify-center bg-gradient-to-br from-mcd-gold via-mcd-red to-mcd-charcoal"
    >
      <span className="text-5xl drop-shadow-md">🍟</span>
    </div>
  )
}

export function ReactionLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        const top = await fetchTopReactedReviews(3)
        if (cancelled) return

        const resolved = (
          await Promise.all(
            top.map(async (entry) => {
              const featured = await getReviewById(entry.reviewId)
              if (!featured) return null

              return {
                ...entry,
                reviewText: featured.text,
                author: featured.author,
                restaurantSlug: featured.restaurant.slug,
                restaurantLabel: `${featured.restaurant.flag} ${featured.restaurant.city}`,
                imageUrl: getReviewImageUrl(featured),
                placeImageUrl: getSafeImageUrl(featured.restaurant.imageUrl),
              }
            }),
          )
        ).filter((entry): entry is LeaderboardEntry => entry !== null)

        setEntries(resolved)
      } catch (error) {
        console.error('Failed to load reaction leaderboard', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  if (!isSupabaseConfigured()) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="mb-4 text-center">
        <h2 className="font-display text-2xl text-mcd-charcoal sm:text-3xl">
          Most Clowned On
        </h2>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <div
              key={slot}
              className="h-56 animate-pulse rounded-xl border-2 border-mcd-charcoal/10 bg-white/70"
            />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {entries.map((entry, index) => {
            const preview = leaderboardPreview(entry.reviewText)
            const showReadMore = hasMoreAfterLeaderboardPreview(entry.reviewText)
            const reviewHref = `/r/${entry.restaurantSlug}#${entry.reviewId}`

            return (
              <Link
                key={entry.reviewId}
                to={reviewHref}
                className="group flex h-full flex-col overflow-hidden rounded-xl border-2 border-mcd-charcoal/10 bg-white shadow-sm transition hover:border-mcd-red/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mcd-red"
              >
                <div className="relative">
                  <LeaderboardImage
                    reviewImageUrl={entry.imageUrl}
                    placeImageUrl={entry.placeImageUrl}
                    author={entry.author}
                  />
                  <span
                    className="absolute left-3 top-3 text-4xl leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] sm:text-5xl"
                    aria-hidden
                  >
                    {RANK_LABELS[index] ?? `#${index + 1}`}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-sm leading-snug text-mcd-charcoal group-hover:text-mcd-charcoal sm:text-base">
                    {preview}
                    {showReadMore && '…'}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-mcd-charcoal/10 pt-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm text-mcd-charcoal sm:text-base">
                        {formatAuthorInitials(entry.author)}
                      </p>
                      <p className="truncate text-sm font-medium text-mcd-charcoal/75 sm:text-base">
                        {entry.restaurantLabel}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-mcd-red px-3 py-1.5 text-sm font-bold tabular-nums text-white shadow-sm sm:text-base">
                      {entry.totalReactions}{' '}
                      {entry.totalReactions === 1 ? 'honk' : 'honks'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-mcd-charcoal/15 bg-white/70 px-4 py-8 text-center">
          <ClownEmoji variant="sad" size={48} className="mx-auto" />
          <p className="mt-3 font-display text-lg text-mcd-charcoal">No clowns yet</p>
        </div>
      )}
    </section>
  )
}
