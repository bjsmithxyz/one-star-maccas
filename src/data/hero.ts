import type { Restaurant, Review } from '../types'

export function getHeroReview(restaurant: Restaurant): Review | undefined {
  return restaurant.reviews.find((review) => review.imageUrl)
}
