#!/usr/bin/env node
/**
 * Ingest real 1-star Google reviews via Places API (New), with legacy fallback.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=... npm run ingest
 *   GOOGLE_MAPS_API_KEY=... npm run ingest -- --slug=times-square-nyc
 *   GOOGLE_MAPS_API_KEY=... npm run ingest -- --input=scripts/places-targets.json
 *   GOOGLE_MAPS_API_KEY=... npm run ingest -- --dry-run
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './lib/load-env.mjs'
import { collectSecretsFromEnv, redactSecrets } from './lib/redact-secrets.mjs'
import { dedupeReviewsBySource, stableReviewId } from './lib/review-id.mjs'
import {
  readRestaurants,
  writeRestaurants,
} from './lib/restaurant-data.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PHOTOS_DIR = path.join(ROOT, 'public/photos')

loadEnvFile(path.join(ROOT, '.env'))

const API_KEY = process.env.GOOGLE_MAPS_API_KEY

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const slugArg = args.find((arg) => arg.startsWith('--slug='))?.split('=')[1]
const inputArg = args.find((arg) => arg.startsWith('--input='))?.split('=').slice(1).join('=')
const delayMs = Number(args.find((arg) => arg.startsWith('--delay='))?.split('=')[1] ?? 250)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: npm run ingest -- [options]

Options:
  --slug=...              Refresh one existing restaurant
  --input=...             Import or refresh a JSON target list
  --delay=250             Delay between locations in milliseconds
  --dry-run               Preview without writing data
  --help                  Show this help`)
  process.exit(0)
}

function safeMessage(message) {
  return redactSecrets(String(message), collectSecretsFromEnv())
}

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
    throw new Error(safeMessage(`Places API error (${response.status}): ${message}`))
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
        'id,displayName,googleMapsUri,googleMapsLinks,reviews,rating,userRatingCount,photos,location',
    },
  })
}

async function getPlaceDetailsLegacy(placeId) {
  const fields = encodeURIComponent(
    'reviews,rating,user_ratings_total,url,name,photos',
  )
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&reviews_sort=newest&key=${API_KEY}`

  const body = await placesFetch(url)
  if (body.status !== 'OK') {
    throw new Error(`Legacy place details: ${body.status} ${body.error_message ?? ''}`)
  }

  return body.result
}

function normalizePlaceId(place) {
  if (!place) return undefined
  if (typeof place === 'string') return place.replace(/^places\//, '')
  if (place.id) return place.id.replace(/^places\//, '')
  if (place.place_id) return place.place_id
  return undefined
}

async function downloadNewPhoto(photoName, destPath) {
  const url =
    `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=900&maxWidthPx=1400&skipHttpRedirect=false`

  const response = await fetch(url, {
    headers: { 'X-Goog-Api-Key': API_KEY },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`Photo download failed (${response.status})`)
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const extension = contentType.includes('png') ? 'png' : 'jpg'
  const finalPath = destPath.replace(/\.(jpg|jpeg|png)$/i, `.${extension}`)

  fs.mkdirSync(path.dirname(finalPath), { recursive: true })
  fs.writeFileSync(finalPath, Buffer.from(await response.arrayBuffer()))

  return finalPath
}

async function downloadLegacyPhoto(photoReference, destPath) {
  const url =
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1400&photo_reference=${photoReference}&key=${API_KEY}`

  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Legacy photo download failed (${response.status})`)
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.writeFileSync(destPath, Buffer.from(await response.arrayBuffer()))
  return destPath
}

function toPublicPath(absolutePath) {
  return `/${path.relative(path.join(ROOT, 'public'), absolutePath).replace(/\\/g, '/')}`
}

async function downloadRestaurantPhoto(place, slug, api) {
  const dest = path.join(PHOTOS_DIR, slug, 'place.jpg')

  try {
    if (api === 'new' && place.photos?.[0]?.name) {
      const saved = await downloadNewPhoto(place.photos[0].name, dest)
      return toPublicPath(saved)
    }

    if (api === 'legacy' && place.photos?.[0]?.photo_reference) {
      const saved = await downloadLegacyPhoto(place.photos[0].photo_reference, dest)
      return toPublicPath(saved)
    }
  } catch (error) {
    console.warn(`  Could not download place photo: ${error.message}`)
  }

  return undefined
}

async function attachReviewPhotos(reviews, slug, api, placeReviews = []) {
  const updated = []

  for (const review of reviews) {
    const next = { ...review }
    if (next.imageUrl) {
      updated.push(next)
      continue
    }

    const apiReview = placeReviews.find(
      (candidate) =>
        (candidate.googleMapsUri ?? candidate.authorAttribution?.uri) ===
          review.sourceUrl ||
        (candidate.text?.text ?? candidate.text ?? '').trim() === review.text,
    )

    try {
      if (api === 'new' && apiReview?.photos?.[0]?.name) {
        const dest = path.join(PHOTOS_DIR, slug, `${review.id}.jpg`)
        const saved = await downloadNewPhoto(apiReview.photos[0].name, dest)
        next.imageUrl = toPublicPath(saved)
      }
    } catch (error) {
      console.warn(`  Review photo skipped (${review.id}): ${error.message}`)
    }

    updated.push(next)
  }

  return updated
}

function mapNewReviews(place, restaurant, placeReviewsUri) {
  const reviews = place.reviews ?? []

  return reviews
    .filter((review) => review.rating === 1)
    .filter((review) => (review.text?.text ?? '').trim().length > 0)
    .map((review, index) => {
      const sourceUrl =
        review.googleMapsUri ??
        review.authorAttribution?.uri ??
        placeReviewsUri ??
        place.googleMapsUri

      return {
        id: stableReviewId(restaurant.id, sourceUrl),
        text: review.text.text.trim(),
        author: review.authorAttribution?.displayName ?? 'Google User',
        date: (review.publishTime ?? new Date().toISOString()).slice(0, 10),
        rating: 1,
        funnyRank: index + 1,
        sourceUrl,
      }
    })
    .filter((review) => Boolean(review.sourceUrl))
}

function mapLegacyReviews(place, restaurant) {
  const reviews = place.reviews ?? []

  return reviews
    .filter((review) => review.rating === 1)
    .filter((review) => (review.text ?? '').trim().length > 0)
    .map((review, index) => {
      const sourceUrl = place.url ?? review.author_url

      return {
        id: stableReviewId(restaurant.id, sourceUrl),
        text: review.text.trim(),
        author: review.author_name ?? 'Google User',
        date: review.time
          ? new Date(review.time * 1000).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        rating: 1,
        funnyRank: index + 1,
        sourceUrl,
      }
    })
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

function mergeReviews(existing, incoming, restaurantId) {
  return rankReviews(dedupeReviewsBySource([...existing, ...incoming], restaurantId))
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

  const incomingWithPhotos = await attachReviewPhotos(
    incoming,
    restaurant.slug,
    api,
    place.reviews ?? [],
  )

  const merged = mergeReviews(restaurant.reviews ?? [], incomingWithPhotos, restaurant.id)
  const reviewsWithPhotos = await attachReviewPhotos(
    merged,
    restaurant.slug,
    api,
    place.reviews ?? [],
  )
  const imageUrl =
    (await downloadRestaurantPhoto(place, restaurant.slug, api)) ??
    restaurant.imageUrl

  console.log(
    `  ${api} API · placeId ${placeId} · +${incomingWithPhotos.length} new 1-star (${reviewsWithPhotos.length} total)`,
  )
  console.log(
    `  photos · place ${imageUrl ? 'yes' : 'no'} · review images ${reviewsWithPhotos.filter((review) => review.imageUrl).length}`,
  )

  if (incomingWithPhotos.length === 0) {
    console.warn('  No 1-star reviews returned (API returns up to 5 reviews).')
  }

  const latitude =
    api === 'new' ? place.location?.latitude : place.geometry?.location?.lat
  const longitude =
    api === 'new' ? place.location?.longitude : place.geometry?.location?.lng

  return {
    ...restaurant,
    name:
      place.displayName?.text ??
      place.name ??
      restaurant.name,
    placeId,
    imageUrl,
    googleMapsUrl:
      place.googleMapsUri ??
      place.googleMapsLinks?.placeUri ??
      place.url ??
      restaurant.googleMapsUrl,
    ...(Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { lat: latitude, lng: longitude }
      : {}),
    reviews: reviewsWithPhotos,
  }
}

function nextRestaurantId(restaurants) {
  const max = restaurants.reduce((highest, restaurant) => {
    const match = /^mcd-(\d+)$/.exec(restaurant.id ?? '')
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)
  return `mcd-${String(max + 1).padStart(3, '0')}`
}

function readImportTargets(restaurants) {
  if (!inputArg) return undefined

  const inputPath = path.resolve(ROOT, inputArg)
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Import file not found: ${inputArg}`)
  }

  const targets = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error('Import file must contain a non-empty JSON array')
  }

  const seen = new Set()
  const working = [...restaurants]
  const imported = []

  for (const [index, target] of targets.entries()) {
    const slug = String(target.slug ?? '').trim()
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(`Target ${index + 1} has an invalid slug`)
    }
    if (seen.has(slug)) throw new Error(`Duplicate slug in import file: ${slug}`)
    seen.add(slug)

    const existing = restaurants.find((restaurant) => restaurant.slug === slug)
    if (existing) {
      imported.push({ ...existing, ...target, slug, reviews: existing.reviews ?? [] })
      continue
    }

    for (const field of ['name', 'city', 'country', 'flag']) {
      if (!String(target[field] ?? '').trim()) {
        throw new Error(`New target ${slug} is missing ${field}`)
      }
    }

    const created = {
      id: nextRestaurantId(working),
      slug,
      name: target.name.trim(),
      city: target.city.trim(),
      country: target.country.trim(),
      flag: target.flag.trim(),
      googleMapsUrl: target.googleMapsUrl,
      placeId: target.placeId,
      lat: target.lat,
      lng: target.lng,
      reviews: [],
    }
    working.push(created)
    imported.push(created)
  }

  return imported
}

async function main() {
  ensureApiKey()

  const restaurants = readRestaurants()
  const importedTargets = readImportTargets(restaurants)
  const sourceRestaurants = importedTargets
    ? [
        ...restaurants,
        ...importedTargets.filter(
          (target) => !restaurants.some((restaurant) => restaurant.slug === target.slug),
        ),
      ]
    : restaurants
  const targets = importedTargets ??
    (slugArg
      ? restaurants.filter((restaurant) => restaurant.slug === slugArg)
      : restaurants)

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

  const output = sourceRestaurants.map(
    (restaurant) => updatedBySlug.get(restaurant.slug) ?? restaurant,
  )

  const added = output.reduce((sum, restaurant, index) => {
    const before = sourceRestaurants[index].reviews?.length ?? 0
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

  writeRestaurants(output)
  console.log('Updated restaurants data and rebuilt split index files')
}

main().catch((error) => {
  console.error(safeMessage(error instanceof Error ? error.message : String(error)))
  process.exit(1)
})
