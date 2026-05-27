#!/usr/bin/env node
/**
 * Ingest real 1-star Google reviews via Places API (New), with legacy fallback.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=... npm run ingest
 *   GOOGLE_MAPS_API_KEY=... npm run ingest -- --slug times-square-nyc
 *   GOOGLE_MAPS_API_KEY=... npm run ingest -- --dry-run
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './lib/load-env.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_PATH = path.join(ROOT, 'src/data/restaurants.json')

loadEnvFile(path.join(ROOT, '.env'))

const API_KEY = process.env.GOOGLE_MAPS_API_KEY

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const slugArg = args.find((arg) => arg.startsWith('--slug='))?.split('=')[1]
const delayMs = Number(args.find((arg) => arg.startsWith('--delay='))?.split('=')[1] ?? 250)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureApiKey() {
  if (!API_KEY) {
    console.error(
      'Missing GOOGLE_MAPS_API_KEY. Copy .env.example to .env and add your key.',
    )
    console.error('Enable Places API (New) in Google Cloud Console.')
    process.exit(1)
  }
}

async function placesFetch(url, options = {}) {
  const response = await fetch(url, options)
  const body = await response.json()

  if (!response.ok) {
    const message = body.error?.message ?? response.statusText
    throw new Error(`Places API error (${response.status}): ${message}`)
  }

  return body
}

async function searchPlaceNew(restaurant) {
  const query = `${restaurant.name}, ${restaurant.city}, ${restaurant.country}`

  const body = await placesFetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.googleMapsUri,places.googleMapsLinks',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'en',
      maxResultCount: 1,
    }),
  })

  return body.places?.[0]
}

async function searchPlaceLegacy(restaurant) {
  const query = encodeURIComponent(
    `${restaurant.name}, ${restaurant.city}, ${restaurant.country}`,
  )
  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`

  const body = await placesFetch(url)
  if (body.status !== 'OK' && body.status !== 'ZERO_RESULTS') {
    throw new Error(`Legacy text search: ${body.status} ${body.error_message ?? ''}`)
  }

  return body.results?.[0]
}

async function getPlaceDetailsNew(placeId) {
  const normalizedId = placeId.startsWith('places/') ? placeId : `places/${placeId}`

  return placesFetch(`https://places.googleapis.com/v1/${normalizedId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'id,displayName,googleMapsUri,googleMapsLinks,reviews,rating,userRatingCount',
    },
  })
}

async function getPlaceDetailsLegacy(placeId) {
  const fields = encodeURIComponent('reviews,rating,user_ratings_total,url,name')
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&reviews_sort=newest&key=${API_KEY}`

  const body = await placesFetch(url)
  if (body.status !== 'OK') {
    throw new Error(`Legacy place details: ${body.status} ${body.error_message ?? ''}`)
  }

  return body.result
}

function isEnglishReview(languageCode) {
  if (!languageCode) return true
  return languageCode.toLowerCase().startsWith('en')
}

function normalizePlaceId(place) {
  if (!place) return undefined
  if (typeof place === 'string') return place.replace(/^places\//, '')
  if (place.id) return place.id.replace(/^places\//, '')
  if (place.place_id) return place.place_id
  return undefined
}

function mapNewReviews(place, restaurant, placeReviewsUri) {
  const reviews = place.reviews ?? []

  return reviews
    .filter((review) => review.rating === 1)
    .filter((review) => isEnglishReview(review.text?.languageCode))
    .filter((review) => (review.text?.text ?? '').trim().length > 0)
    .map((review, index) => ({
      id: `${restaurant.id}-g-${index + 1}`,
      text: review.text.text.trim(),
      author: review.authorAttribution?.displayName ?? 'Google User',
      date: (review.publishTime ?? new Date().toISOString()).slice(0, 10),
      rating: 1,
      funnyRank: index + 1,
      sourceUrl:
        review.googleMapsUri ??
        review.authorAttribution?.uri ??
        placeReviewsUri ??
        place.googleMapsUri,
      imageUrl: review.photos?.[0]?.googleMapsUri,
    }))
    .filter((review) => Boolean(review.sourceUrl))
}

function mapLegacyReviews(place, restaurant) {
  const reviews = place.reviews ?? []

  return reviews
    .filter((review) => review.rating === 1)
    .filter((review) => (review.text ?? '').trim().length > 0)
    .map((review, index) => ({
      id: `${restaurant.id}-g-${index + 1}`,
      text: review.text.trim(),
      author: review.author_name ?? 'Google User',
      date: review.time
        ? new Date(review.time * 1000).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      rating: 1,
      funnyRank: index + 1,
      sourceUrl: place.url ?? review.author_url,
    }))
    .filter((review) => Boolean(review.sourceUrl))
}

function rankReviews(reviews) {
  return [...reviews]
    .sort((a, b) => b.text.length - a.text.length)
    .map((review, index) => ({
      ...review,
      funnyRank: index + 1,
    }))
}

function mergeReviews(existing, incoming) {
  const seen = new Set(existing.map((review) => review.sourceUrl))
  const merged = [...existing]

  for (const review of incoming) {
    if (seen.has(review.sourceUrl)) continue
    seen.add(review.sourceUrl)
    merged.push(review)
  }

  return rankReviews(merged)
}

async function resolvePlace(restaurant) {
  if (restaurant.placeId) {
    try {
      const place = await getPlaceDetailsNew(restaurant.placeId)
      return { place, placeId: normalizePlaceId(place), api: 'new' }
    } catch {
      const place = await getPlaceDetailsLegacy(restaurant.placeId)
      return { place, placeId: restaurant.placeId, api: 'legacy' }
    }
  }

  try {
    const found = await searchPlaceNew(restaurant)
    if (found?.id) {
      const placeId = normalizePlaceId(found)
      const place = await getPlaceDetailsNew(placeId)
      return { place, placeId, api: 'new' }
    }
  } catch (error) {
    console.warn(`  New API search failed: ${error.message}`)
  }

  const legacyFound = await searchPlaceLegacy(restaurant)
  if (!legacyFound?.place_id) {
    throw new Error('Could not find place on Google Maps')
  }

  const place = await getPlaceDetailsLegacy(legacyFound.place_id)
  return { place, placeId: legacyFound.place_id, api: 'legacy' }
}

async function ingestRestaurant(restaurant) {
  console.log(`→ ${restaurant.name} (${restaurant.city})`)

  const { place, placeId, api } = await resolvePlace(restaurant)
  const placeReviewsUri =
    place.googleMapsLinks?.reviewsUri ?? place.googleMapsLinks?.reviewsURI

  const incoming =
    api === 'new'
      ? mapNewReviews(place, restaurant, placeReviewsUri)
      : mapLegacyReviews(place, restaurant)

  const merged = mergeReviews(restaurant.reviews ?? [], incoming)

  console.log(
    `  ${api} API · placeId ${placeId} · +${incoming.length} new 1-star (${merged.length} total)`,
  )

  if (incoming.length === 0) {
    console.warn('  No 1-star English reviews returned (API returns up to 5 reviews).')
  }

  return {
    ...restaurant,
    placeId,
    googleMapsUrl:
      place.googleMapsUri ??
      place.googleMapsLinks?.placeUri ??
      place.url ??
      restaurant.googleMapsUrl,
    reviews: merged,
  }
}

async function main() {
  ensureApiKey()

  const restaurants = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const targets = slugArg
    ? restaurants.filter((restaurant) => restaurant.slug === slugArg)
    : restaurants

  if (targets.length === 0) {
    console.error(slugArg ? `No restaurant found for slug: ${slugArg}` : 'No restaurants found')
    process.exit(1)
  }

  console.log(`Ingesting ${targets.length} location(s)${dryRun ? ' (dry run)' : ''}…\n`)

  const updatedBySlug = new Map()

  for (const restaurant of targets) {
    try {
      updatedBySlug.set(restaurant.slug, await ingestRestaurant(restaurant))
    } catch (error) {
      console.error(`  Failed: ${error.message}`)
      updatedBySlug.set(restaurant.slug, restaurant)
    }

    await sleep(delayMs)
  }

  const output = restaurants.map(
    (restaurant) => updatedBySlug.get(restaurant.slug) ?? restaurant,
  )

  const added = output.reduce((sum, restaurant, index) => {
    const before = restaurants[index].reviews?.length ?? 0
    const after = restaurant.reviews?.length ?? 0
    return sum + Math.max(0, after - before)
  }, 0)

  console.log(`\nDone. ${added} new review(s) ingested.`)

  if (dryRun) {
    for (const restaurant of targets) {
      const updated = updatedBySlug.get(restaurant.slug) ?? restaurant
      console.log(`\n${restaurant.slug}: ${updated.reviews.length} review(s)`)
      for (const review of updated.reviews) {
        console.log(`  · ${review.author}: ${review.text.slice(0, 100)}${review.text.length > 100 ? '…' : ''}`)
        console.log(`    ${review.sourceUrl}`)
      }
    }
    return
  }

  fs.writeFileSync(DATA_PATH, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Updated ${DATA_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
