import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getReviewById,
  getReviewImageUrl,
  getReviewSourceUrl,
} from '../data'
import {
  fetchTopReactedReviews,
  isSupabaseConfigured,
  type TopReactedReview,
} from '../lib/supabase'

const RANK_LABELS = ['🥇', '🥈', '🥉']

type LeaderboardEntry = TopReactedReview & {
  reviewText: string
  author: string
  restaurantSlug: string
  restaurantLabel: string
  imageUrl: string
  sourceUrl: string
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

        const resolved = top
          .map((entry) => {
            const featured = getReviewById(entry.reviewId)
            if (!featured) return null

            return {
              ...entry,
              reviewText: featured.text,
              author: featured.author,
              restaurantSlug: featured.restaurant.slug,
              restaurantLabel: `${featured.restaurant.flag} ${featured.restaurant.city}`,
              imageUrl: getReviewImageUrl(featured),
              sourceUrl: getReviewSourceUrl(featured),
            }
          })
          .filter((entry): entry is LeaderboardEntry => entry !== null)

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
    <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-mcd-charcoal sm:text-3xl">
          Most Clowned On
        </h2>
        <p className="mt-2 text-sm text-mcd-charcoal/70">
          Top 3 reviews by total reactions
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <div
              key={slot}
              className="h-48 animate-pulse rounded-2xl border-2 border-mcd-charcoal/10 bg-white/70"
            />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {entries.map((entry, index) => (
            <article
              key={entry.reviewId}
              className="overflow-hidden rounded-2xl border-2 border-mcd-charcoal/10 bg-white shadow-sm"
            >
              {entry.imageUrl && (
                <img
                  src={entry.imageUrl}
                  alt={`Photo from ${entry.author}'s review`}
                  className="aspect-[4/3] w-full object-cover"
                />
              )}

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-2xl" aria-hidden>
                    {RANK_LABELS[index] ?? `#${index + 1}`}
                  </span>
                  <span className="rounded-full bg-mcd-red/10 px-3 py-1 text-sm font-semibold text-mcd-red">
                    {entry.totalReactions} reaction
                    {entry.totalReactions === 1 ? '' : 's'}
                  </span>
                </div>

                <p className="line-clamp-4 text-sm leading-relaxed text-mcd-charcoal">
                  {entry.reviewText}
                </p>

                <p className="mt-3 text-xs text-mcd-charcoal/70">
                  {entry.author}
                </p>

                <Link
                  to={`/r/${entry.restaurantSlug}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-mcd-charcoal underline decoration-mcd-gold decoration-2 underline-offset-2 transition hover:text-mcd-red"
                >
                  {entry.restaurantLabel} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-mcd-charcoal/15 bg-white/70 px-6 py-10 text-center">
          <p className="font-display text-xl text-mcd-charcoal">No reactions yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mcd-charcoal/70">
            Clown on a review below to start the leaderboard.
          </p>
        </div>
      )}
    </section>
  )
}
