import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RandomButton } from '../components/RandomButton'
import { ReactionLeaderboard } from '../components/ReactionLeaderboard'
import { ReviewCard } from '../components/ReviewCard'
import { SITE_NAME } from '../constants/branding'
import { getFeaturedReviews, getReviewSourceUrl, getSiteStats } from '../data'

export function HomePage() {
  const featured = getFeaturedReviews(12)
  const stats = getSiteStats()

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="text-center">
          <h1 className="font-display text-4xl leading-none text-mcd-charcoal sm:text-6xl">
            {SITE_NAME}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-mcd-charcoal/75 sm:text-lg">
            The worst 1-star Google reviews from McDonald&apos;s around the
            world.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <RandomButton size="lg" />
            <p className="text-sm text-mcd-charcoal/60">
              {stats.restaurantCount} restaurant
              {stats.restaurantCount === 1 ? '' : 's'}
              {stats.reviewCount > 0 &&
                ` · ${stats.reviewCount} review${stats.reviewCount === 1 ? '' : 's'}`}
              {stats.locationCount > stats.restaurantCount &&
                ` · ${stats.locationCount} locations tracked`}
              {' · '}
              <Link
                to="/map"
                className="font-semibold text-mcd-charcoal underline decoration-mcd-gold decoration-2 underline-offset-2 transition hover:text-mcd-red"
              >
                view map
              </Link>
            </p>
          </div>
        </div>
      </section>

      <ReactionLeaderboard />

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6">
          <h2 className="font-display text-2xl text-mcd-charcoal sm:text-3xl">
            Hall of Fame
          </h2>
        </div>

        {featured.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <ReviewCard
                key={item.sourceUrl}
                review={item}
                restaurant={item.restaurant}
                showLocation
                sourceUrl={getReviewSourceUrl(item)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-mcd-charcoal/15 bg-white/70 px-6 py-12 text-center">
            <p className="font-display text-xl text-mcd-charcoal">No reviews yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-mcd-charcoal/70">
              Real 1-star Google reviews with live links will appear here once
              they&apos;re added to the dataset.
            </p>
          </div>
        )}
      </section>
    </Layout>
  )
}

export function NotFoundPage() {
  return (
    <Layout>
      <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <p className="text-6xl">🍟</p>
        <h1 className="mt-4 font-display text-3xl text-mcd-charcoal">
          This McDonald&apos;s doesn&apos;t exist
        </h1>
        <p className="mt-2 text-mcd-charcoal/70">
          Maybe it closed. Maybe it was never real. Maybe the ice cream machine
          ate it.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <RandomButton size="lg" label="Try Random" />
          <Link
            to="/"
            className="rounded-full border-2 border-mcd-charcoal/20 px-6 py-3 font-semibold text-mcd-charcoal transition hover:border-mcd-red hover:text-mcd-red"
          >
            Back home
          </Link>
        </div>
      </section>
    </Layout>
  )
}
