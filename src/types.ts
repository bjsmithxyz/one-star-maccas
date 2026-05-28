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
  lat?: number
  lng?: number
  imageUrl?: string
  reviews: Review[]
}

export type FeaturedReview = Review & {
  restaurant: Restaurant
}

export type SiteStats = {
  /** Every McDonald's location in the dataset */
  locationCount: number
  /** Locations with at least one curated 1-star review */
  restaurantCount: number
  /** Total curated 1-star reviews across all locations */
  reviewCount: number
}
