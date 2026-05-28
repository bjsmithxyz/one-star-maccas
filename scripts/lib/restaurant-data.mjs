import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DATA_DIR = path.join(ROOT, 'src/data')

export const DATA_PATH = path.join(DATA_DIR, 'restaurants.json')
export const INDEX_PATH = path.join(DATA_DIR, 'restaurants-index.json')
export const REVIEW_INDEX_PATH = path.join(DATA_DIR, 'review-index.json')
export const REVIEWS_DIR = path.join(DATA_DIR, 'reviews')

export function readRestaurants() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
}

export function writeRestaurants(restaurants) {
  fs.writeFileSync(DATA_PATH, `${JSON.stringify(restaurants, null, 2)}\n`)
  splitRestaurantsData(restaurants)
}

export function splitRestaurantsData(restaurants = readRestaurants()) {
  fs.mkdirSync(REVIEWS_DIR, { recursive: true })

  const index = []
  const reviewIndex = {}

  for (const restaurant of restaurants) {
    const { reviews = [], ...meta } = restaurant
    index.push({
      ...meta,
      reviewCount: reviews.length,
    })

    fs.writeFileSync(
      path.join(REVIEWS_DIR, `${restaurant.slug}.json`),
      `${JSON.stringify(reviews, null, 2)}\n`,
    )

    for (const review of reviews) {
      reviewIndex[review.id] = restaurant.slug
    }
  }

  fs.writeFileSync(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`)
  fs.writeFileSync(REVIEW_INDEX_PATH, `${JSON.stringify(reviewIndex, null, 2)}\n`)

  return { restaurantCount: index.length, reviewCount: Object.keys(reviewIndex).length }
}
