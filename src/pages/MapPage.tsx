import { Layout } from '../components/Layout'
import { RestaurantMap } from '../components/RestaurantMap'
import { getMapRestaurants } from '../data'

export function MapPage() {
  const restaurants = getMapRestaurants()

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl text-mcd-charcoal sm:text-4xl">
            Global map
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-mcd-charcoal/70 sm:text-base">
            Tap a pin to read the misery.
          </p>
        </div>

        {restaurants.length > 0 ? (
          <RestaurantMap restaurants={restaurants} />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-mcd-charcoal/15 bg-white/70 px-6 py-12 text-center">
            <p className="font-display text-xl text-mcd-charcoal">No map data yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-mcd-charcoal/70">
              Run <code className="rounded bg-mcd-charcoal/5 px-1">npm run geocode</code>{' '}
              to add coordinates to locations.
            </p>
          </div>
        )}
      </section>
    </Layout>
  )
}
