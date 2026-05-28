import restaurantsIndex from './restaurants-index.json'
import reviewSlugById from './review-index.json'
import type {
  FeaturedReview,
  Restaurant,
  RestaurantMeta,
  Review,
  SiteStats,
} from '../types'
import {
  sanitizeGoogleReviewUrl,
  sanitizeGoogleUrl,
  sanitizeImageUrl,
  sanitizeSlug,
} from '../lib/security'
import { reviewOwnsImageUrl } from '../lib/review-images'

const restaurantMeta = restaurantsIndex as RestaurantMeta[]
const reviewSlugIndex = reviewSlugById as Record<string, string>

const reviewLoaders = import.meta.glob<Review[]>('./reviews/*.json', {
  import: 'default',
})

function metaToRestaurant(meta: RestaurantMeta, reviews: Review[]): Restaurant {
  const { reviewCount: _reviewCount, ...rest } = meta
  return { ...rest, reviews }
}

export function getAllRestaurantMeta(): RestaurantMeta[] {
  return restaurantMeta
}

export async function loadRestaurantReviews(slug: string): Promise<Review[]> {
  const loader = reviewLoaders[`./reviews/${slug}.json`]
  if (!loader) return []
  return loader()
}

export function getRestaurantMetaBySlug(slug: string): RestaurantMeta | undefined {
  const safeSlug = sanitizeSlug(slug)
  if (!safeSlug) return undefined

  return restaurantMeta.find((restaurant) => restaurant.slug === safeSlug)
}

export async function getRestaurantBySlug(
  slug: string,
): Promise<Restaurant | undefined> {
  const meta = getRestaurantMetaBySlug(slug)
  if (!meta) return undefined

  const reviews = await loadRestaurantReviews(meta.slug)
  return metaToRestaurant(meta, reviews)
}

export function getSiteStats(): SiteStats {
  const locationCount = restaurantMeta.length
  const restaurantCount = restaurantMeta.filter(
    (restaurant) => restaurant.reviewCount > 0,
  ).length
  const reviewCount = restaurantMeta.reduce(
    (sum, restaurant) => sum + restaurant.reviewCount,
    0,
  )

  return { locationCount, restaurantCount, reviewCount }
}

export function getMapRestaurants(): RestaurantMeta[] {
  return restaurantMeta.filter(
    (restaurant) =>
      typeof restaurant.lat === 'number' && typeof restaurant.lng === 'number',
  )
}

export function getRandomRestaurant(excludeSlug?: string): RestaurantMeta {
  const pool = excludeSlug
    ? restaurantMeta.filter((restaurant) => restaurant.slug !== excludeSlug)
    : restaurantMeta

  const index = Math.floor(Math.random() * pool.length)
  return pool[index] ?? restaurantMeta[0]
}

export { reviewOwnsImageUrl } from '../lib/review-images'

export function getReviewSourceUrl(review: { sourceUrl: string }): string {
  return sanitizeGoogleReviewUrl(review.sourceUrl)
}

export async function getReviewById(
  reviewId: string,
): Promise<FeaturedReview | undefined> {
  const slug = reviewSlugIndex[reviewId]
  if (!slug) return undefined

  const meta = getRestaurantMetaBySlug(slug)
  if (!meta) return undefined

  const reviews = await loadRestaurantReviews(slug)
  const review = reviews.find((item) => item.id === reviewId)
  if (!review) return undefined

  return { ...review, restaurant: metaToRestaurant(meta, reviews) }
}

export function getReviewImageUrl(
  review: Pick<Review, 'id' | 'imageUrl'>,
): string {
  if (!reviewOwnsImageUrl(review)) return ''
  return getSafeImageUrl(review.imageUrl)
}

export function getSafeGoogleMapsUrl(
  restaurant: Pick<Restaurant, 'googleMapsUrl'>,
): string {
  return sanitizeGoogleUrl(restaurant.googleMapsUrl)
}

export function getSafeImageUrl(imageUrl: string | undefined): string {
  const sanitized = sanitizeImageUrl(imageUrl)
  if (!sanitized) return ''

  if (sanitized.startsWith('/photos/')) {
    const base = import.meta.env.BASE_URL
    return `${base}${sanitized.slice(1)}`
  }

  return sanitized
}
