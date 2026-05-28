#!/usr/bin/env node
/**
 * Remove review imageUrl values that don't belong to that review
 * (e.g. shared legacy Outscraper paths reused across multiple reviews).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../src/data/restaurants.json')

export function reviewOwnsImageUrl(review) {
  if (!review.imageUrl) return false
  const filename = review.imageUrl.split('/').pop() ?? ''
  return filename.startsWith(review.id)
}

const restaurants = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
let removed = 0

for (const restaurant of restaurants) {
  for (const review of restaurant.reviews) {
    if (review.imageUrl && !reviewOwnsImageUrl(review)) {
      delete review.imageUrl
      removed += 1
    }
  }
}

fs.writeFileSync(DATA_PATH, `${JSON.stringify(restaurants, null, 2)}\n`)
console.log(`Removed ${removed} mismatched review image(s).`)
