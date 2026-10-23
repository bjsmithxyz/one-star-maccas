import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RandomButton } from '../components/RandomButton'
import { SITE_NAME } from '../constants/branding'
import { getSiteStats } from '../data'
import { updatePageMetadata } from '../lib/seo'

export function HomePage() {
  const stats = getSiteStats()

  useEffect(() => {
    updatePageMetadata({ title: SITE_NAME })
  }, [])

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-mcd-red">
            One-star reviews · Worldwide
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight text-mcd-charcoal sm:text-7xl">
            The worst bites of the internet.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mcd-charcoal/65 sm:text-lg">
            A collection of brutally honest McDonald&apos;s reviews.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <RandomButton size="lg" label="Show me a review" />
            <Link
              to="/map"
              className="inline-flex items-center justify-center rounded-xl border border-mcd-charcoal/15 bg-white/60 px-5 py-3.5 text-sm font-bold text-mcd-charcoal transition hover:border-mcd-charcoal/30 hover:bg-white"
            >
              Explore the map
            </Link>
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-wider text-mcd-charcoal/45">
            {stats.reviewCount} reviews · {stats.restaurantCount} locations
          </p>
        </div>
      </section>

    </Layout>
  )
}

export function NotFoundPage() {
  useEffect(() => {
    updatePageMetadata({ title: `Not Found — ${SITE_NAME}` })
  }, [])

  return (
    <Layout>
      <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <p className="text-6xl">🍟</p>
        <h1 className="mt-4 font-display text-3xl text-mcd-charcoal">
          This McDonald&apos;s doesn&apos;t exist
        </h1>
        <p className="mt-2 text-mcd-charcoal/70">
          This page couldn&apos;t be found.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <RandomButton size="lg" label="Try Random" />
          <Link
            to="/"
            className="rounded-xl border border-mcd-charcoal/15 bg-white/60 px-5 py-3 font-semibold text-mcd-charcoal transition hover:border-mcd-charcoal/30 hover:bg-white"
          >
            Back home
          </Link>
        </div>
      </section>
    </Layout>
  )
}
