import restaurantsData from './restaurants.json'
import type { FeaturedReview, Restaurant } from '../types'

const restaurants = restaurantsData as Restaurant[]

export function getAllRestaurants(): Restaurant[] {
  return restaurants
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
