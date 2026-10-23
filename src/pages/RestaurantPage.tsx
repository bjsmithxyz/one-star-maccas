import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RestaurantHero } from '../components/RestaurantHero'
import { ReviewCard } from '../components/ReviewCard'
import { SITE_NAME } from '../constants/branding'
import {
  getRestaurantMetaBySlug,
  getReviewSourceUrl,
  getSafeGoogleMapsUrl,
  loadRestaurantReviews,
} from '../data'
import type { Restaurant } from '../types'
import { SafeExternalLink } from '../components/SafeExternalLink'
import { updatePageMetadata } from '../lib/seo'

export function RestaurantPage() {
  const { slug } = useParams()
  const meta = slug ? getRestaurantMetaBySlug(slug) : undefined
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>()
  const isLoading = Boolean(meta && restaurant?.slug !== meta.slug)

  useEffect(() => {
    if (!meta) return

    let cancelled = false

    void loadRestaurantReviews(meta.slug).then((reviews) => {
      if (cancelled) return
      setRestaurant({ ...meta, reviews })
    })

    return () => {
      cancelled = true
    }
  }, [meta])

  useEffect(() => {
    if (!meta) {
      updatePageMetadata({ title: `Not Found — ${SITE_NAME}` })
      return
    }

    updatePageMetadata({
      title: `${meta.name} — ${SITE_NAME}`,
      description: `Read curated one-star Google reviews from ${meta.name} in ${meta.city}, ${meta.country}.`,
    })
  }, [meta])

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash || !restaurant) return

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [restaurant])

  if (!meta) {
    return <Navigate to="/404" replace />
  }

  if (isLoading || !restaurant) {
    return (
      <Layout excludeSlug={meta.slug}>
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className="font-display text-lg text-mcd-charcoal/70">
            Loading reviews…
          </p>
        </section>
      </Layout>
    )
  }

  const reviews = [...restaurant.reviews].sort(
    (a, b) => a.funnyRank - b.funnyRank,
  )
  const googleMapsUrl = getSafeGoogleMapsUrl(restaurant)

  return (
    <Layout excludeSlug={restaurant.slug}>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-mcd-charcoal/70 transition hover:text-mcd-red"
        >
          ← All reviews
        </Link>

        <RestaurantHero restaurant={restaurant} />

        <div className="mt-8">
          <h2 className="font-display text-2xl text-mcd-charcoal">
            {reviews.length === 0
              ? 'No reviews yet'
              : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
          </h2>
        </div>

        {reviews.length > 0 ? (
          <div key={restaurant.slug} className="review-stagger mt-6 grid gap-5">
            {reviews.map((review) => (
              <ReviewCard
                key={review.sourceUrl}
                review={review}
                sourceUrl={getReviewSourceUrl(review)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-mcd-charcoal/15 bg-white/70 px-6 py-10 text-center">
            <p className="text-sm text-mcd-charcoal/70">
              No curated reviews yet.
            </p>
            {googleMapsUrl && (
              <SafeExternalLink
                href={googleMapsUrl}
                className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-mcd-charcoal/15 px-4 py-2 text-sm font-semibold text-mcd-charcoal transition hover:border-mcd-red hover:text-mcd-red"
              >
                View on Google Maps ↗
              </SafeExternalLink>
            )}
          </div>
        )}
      </section>
    </Layout>
  )
}
