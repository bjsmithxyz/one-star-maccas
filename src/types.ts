export type Review = {
  id: string
  text: string
  author: string
  date: string
  rating: 1
  funnyRank: number
  sourceUrl: string
  imageUrl?: string
}

export type Restaurant = {
  id: string
  slug: string
  name: string
  city: string
  country: string
  flag: string
  googleMapsUrl?: string
  placeId?: string
  imageUrl?: string
  reviews: Review[]
}

export type FeaturedReview = Review & {
  restaurant: Restaurant
}
