#!/usr/bin/env node
/**
 * Add lat/lng to restaurants.json via OpenStreetMap Nominatim (no API key).
 *
 * Usage: npm run geocode
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_PATH = path.join(ROOT, 'src/data/restaurants.json')

const USER_AGENT = 'mcd-1star-reviews/1.0 (github.com/bjsmithxyz/one-star-maccas)'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocode(restaurant) {
  const query = encodeURIComponent(
    `${restaurant.name}, ${restaurant.city}, ${restaurant.country}`,
  )
  const url =
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  })

  if (!response.ok) {
    throw new Error(`Nominatim error (${response.status})`)
  }

  const results = await response.json()
  if (!results.length) {
    throw new Error('No results')
  }

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
  }
}

async function main() {
  const restaurants = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

  for (const restaurant of restaurants) {
    if (restaurant.lat != null && restaurant.lng != null) {
      console.log(`✓ ${restaurant.slug} (cached)`)
      continue
    }

    try {
      const coords = await geocode(restaurant)
      restaurant.lat = coords.lat
      restaurant.lng = coords.lng
      console.log(`→ ${restaurant.slug}: ${coords.lat}, ${coords.lng}`)
    } catch (error) {
      console.error(`  Failed ${restaurant.slug}: ${error.message}`)
    }

    await sleep(1100)
  }

  fs.writeFileSync(DATA_PATH, `${JSON.stringify(restaurants, null, 2)}\n`)
  console.log(`\nUpdated ${DATA_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
