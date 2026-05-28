import restaurantsData from './restaurants.json'
import type { FeaturedReview, Restaurant, Review, SiteStats } from '../types'
import {
  sanitizeGoogleReviewUrl,
  sanitizeGoogleUrl,
  sanitizeImageUrl,
  sanitizeSlug,
} from '../lib/security'
import { reviewOwnsImageUrl } from '../lib/review-images'

const restaurants = restaurantsData as Restaurant[]

export function getAllRestaurants(): Restaurant[] {
  return restaurants
}

export function getSiteStats(): SiteStats {
  const locationCount = restaurants.length
  const restaurantCount = restaurants.filter(
    (restaurant) => restaurant.reviews.length > 0,
  ).length
  const reviewCount = restaurants.reduce(
    (sum, restaurant) => sum + restaurant.reviews.length,
    0,
  )

  return { locationCount, restaurantCount, reviewCount }
}

export function getMapRestaurants(): Restaurant[] {
  return restaurants.filter(
    (restaurant) =>
      typeof restaurant.lat === 'number' && typeof restaurant.lng === 'number',
  )
}

export function getRestaurantBySlug(slug: string): Restaurant | undefined {
  const safeSlug = sanitizeSlug(slug)
  if (!safeSlug) return undefined

  return restaurants.find((restaurant) => restaurant.slug === safeSlug)
}

export function getRandomRestaurant(excludeSlug?: string): Restaurant {
  const pool = excludeSlug
    ? restaurants.filter((restaurant) => restaurant.slug !== excludeSlug)
    : restaurants

  const index = Math.floor(Math.random() * pool.length)
  return pool[index] ?? restaurants[0]
}

export function getFeaturedReviews(limit = 12): FeaturedReview[] {
  const featured = restaurants.flatMap((restaurant) =>
    restaurant.reviews.map((review) => ({
      ...review,
      restaurant,
    })),
  )

  return featured
    .sort((a, b) => a.funnyRank - b.funnyRank)
    .slice(0, limit)
}

export { reviewOwnsImageUrl } from '../lib/review-images'

export function getReviewSourceUrl(review: { sourceUrl: string }): string {
  return sanitizeGoogleReviewUrl(review.sourceUrl)
}

export function getReviewById(reviewId: string): FeaturedReview | undefined {
  for (const restaurant of restaurants) {
    const review = restaurant.reviews.find((item) => item.id === reviewId)
    if (review) {
      return { ...review, restaurant }
    }
  }
  return undefined
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
