import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RandomButton } from '../components/RandomButton'
import { RestaurantHero } from '../components/RestaurantHero'
import { ReviewCard } from '../components/ReviewCard'
import { getHeroReview } from '../data/hero'
import { getRestaurantBySlug } from '../data'

export function RestaurantPage() {
  const { slug } = useParams()
  const restaurant = slug ? getRestaurantBySlug(slug) : undefined

  useEffect(() => {
    document.title = restaurant
      ? `${restaurant.name} — One Star Maccas`
      : 'Not Found — One Star Maccas'
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
          heroReview={
            heroReview?.imageUrl
              ? { imageUrl: heroReview.imageUrl, author: heroReview.author }
              : undefined
          }
        />

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl text-mcd-charcoal">
            {reviews.length} one-star masterpieces
          </h2>
          <RandomButton
            excludeSlug={restaurant.slug}
            size="sm"
            label="Another Random"
          />
        </div>

        <div className="review-stagger mt-6 grid gap-5">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </Layout>
  )
}
