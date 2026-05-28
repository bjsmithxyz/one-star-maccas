import restaurantsData from './restaurants.json'
import type { FeaturedReview, Restaurant, SiteStats } from '../types'

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

export function getRestaurantBySlug(slug: string): Restaurant | undefined {
  return restaurants.find((restaurant) => restaurant.slug === slug)
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

export function getReviewSourceUrl(review: { sourceUrl: string }): string {
  return review.sourceUrl
}
