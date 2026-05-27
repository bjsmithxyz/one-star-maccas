import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RandomButton } from '../components/RandomButton'
import { RestaurantHero } from '../components/RestaurantHero'
import { ReviewCard } from '../components/ReviewCard'
import { getHeroReview } from '../data/hero'
import { SITE_NAME } from '../constants/branding'
import { getRestaurantBySlug, getReviewSourceUrl } from '../data'

export function RestaurantPage() {
  const { slug } = useParams()
  const restaurant = slug ? getRestaurantBySlug(slug) : undefined

  useEffect(() => {
    document.title = restaurant
      ? `${restaurant.name} — ${SITE_NAME}`
      : `Not Found — ${SITE_NAME}`
  }, [restaurant])

  if (!restaurant) {
    return <Navigate to="/404" replace />
  }

  const reviews = [...restaurant.reviews].sort(
    (a, b) => a.funnyRank - b.funnyRank,
  )
  const heroReview = getHeroReview(restaurant)

  return (
    <Layout excludeSlug={restaurant.slug}>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-mcd-charcoal/70 transition hover:text-mcd-red"
        >
          ← Back to all reviews
        </Link>

        <RestaurantHero
          restaurant={restaurant}
          heroImage={
            heroReview?.imageUrl
              ? { url: heroReview.imageUrl, author: heroReview.author }
              : undefined
          }
        />

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl text-mcd-charcoal">
            {reviews.length === 0
              ? 'No reviews yet'
              : `${reviews.length} one-star masterpiece${reviews.length === 1 ? '' : 's'}`}
          </h2>
          <RandomButton
            excludeSlug={restaurant.slug}
            size="sm"
            label="Another Random"
          />
        </div>

        {reviews.length > 0 ? (
          <div className="review-stagger mt-6 grid gap-5">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                sourceUrl={getReviewSourceUrl(review)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-mcd-charcoal/15 bg-white/70 px-6 py-10 text-center">
            <p className="text-sm text-mcd-charcoal/70">
              No curated reviews for this location yet. Check Google Maps for
              live 1-star comments.
            </p>
            {restaurant.googleMapsUrl && (
              <a
                href={restaurant.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-mcd-charcoal/15 px-4 py-2 text-sm font-semibold text-mcd-charcoal transition hover:border-mcd-red hover:text-mcd-red"
              >
                View on Google Maps ↗
              </a>
            )}
          </div>
        )}
      </section>
    </Layout>
  )
}
