import type { Restaurant, Review } from '../types'
import { reviewOwnsImageUrl } from '../lib/review-images'

export function getReviewsWithImages(restaurant: Restaurant): Review[] {
  return restaurant.reviews.filter((review) => reviewOwnsImageUrl(review))
}

export function getRandomReviewWithImage(restaurant: Restaurant): Review | undefined {
  const withImages = getReviewsWithImages(restaurant)
  if (withImages.length === 0) return undefined

  const index = Math.floor(Math.random() * withImages.length)
  return withImages[index]
}
