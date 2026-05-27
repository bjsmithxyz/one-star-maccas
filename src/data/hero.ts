import type { Restaurant, Review } from '../types'

export function getHeroReview(restaurant: Restaurant): Review | undefined {
  return (
    restaurant.reviews.find((review) => review.imageUrl) ??
    [...restaurant.reviews]
      .sort((a, b) => b.funnyRank - a.funnyRank)
      .find((review) => review.funnyRank >= 3)
  )
}
