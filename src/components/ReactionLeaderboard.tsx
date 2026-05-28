import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClownEmoji } from './ClownEmoji'
import { getReviewById, getReviewImageUrl } from '../data'
import {
  fetchTopReactedReviews,
  isSupabaseConfigured,
  type TopReactedReview,
} from '../lib/supabase'
import { firstSentence, hasMoreAfterFirstSentence } from '../lib/text'

const RANK_LABELS = ['🥇', '🥈', '🥉']

type LeaderboardEntry = TopReactedReview & {
  reviewText: string
  author: string
  restaurantSlug: string
  restaurantLabel: string
  imageUrl: string
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
    <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="mb-4 text-center">
        <h2 className="font-display text-2xl text-mcd-charcoal sm:text-3xl">
          Most Clowned On
        </h2>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <div
              key={slot}
              className="h-28 animate-pulse rounded-xl border-2 border-mcd-charcoal/10 bg-white/70"
            />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {entries.map((entry, index) => {
            const preview = firstSentence(entry.reviewText)
            const showReadMore = hasMoreAfterFirstSentence(entry.reviewText)
            const reviewHref = `/r/${entry.restaurantSlug}#${entry.reviewId}`

            return (
              <article
                key={entry.reviewId}
                className="overflow-hidden rounded-xl border-2 border-mcd-charcoal/10 bg-white shadow-sm"
              >
                {entry.imageUrl && (
                  <img
                    src={entry.imageUrl}
                    alt=""
                    className="aspect-[2/1] w-full object-cover"
                  />
                )}

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xl leading-none" aria-hidden>
                      {RANK_LABELS[index] ?? `#${index + 1}`}
                    </span>
                    <span className="rounded-full bg-mcd-red/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-mcd-red">
                      {entry.totalReactions}
                    </span>
                  </div>

                  <p className="text-sm leading-snug text-mcd-charcoal">
                    {preview}
                    {showReadMore && (
                      <>
                        {' '}
                        <Link
                          to={reviewHref}
                          className="font-semibold text-mcd-red underline decoration-mcd-gold decoration-2 underline-offset-2 hover:text-mcd-charcoal"
                        >
                          read more...
                        </Link>
                      </>
                    )}
                  </p>

                  <p className="mt-2 text-xs text-mcd-charcoal/60">
                    {entry.author} · {entry.restaurantLabel}
                  </p>
                </div>
              </article>
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
