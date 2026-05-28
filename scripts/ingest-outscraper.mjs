#!/usr/bin/env node
/**
 * Ingest 1-star Google reviews via Outscraper (more reviews + review photos).
 *
 * Free tier: 500 reviews/month. See https://outscraper.com/google-maps-reviews-api/
 *
 * Usage:
 *   OUTSCRAPER_API_KEY=... npm run ingest:outscraper
 *   OUTSCRAPER_API_KEY=... npm run ingest:outscraper -- --slug=times-square-nyc
 *   OUTSCRAPER_API_KEY=... npm run ingest:outscraper -- --dry-run
 *   OUTSCRAPER_API_KEY=... npm run ingest:outscraper -- --reviews-limit=30
 *   OUTSCRAPER_API_KEY=... npm run ingest:outscraper -- --reviews-limit=10 --limit=48
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dedupeReviewsBySource, stableReviewId } from './lib/review-id.mjs'
import { loadEnvFile } from './lib/load-env.mjs'
import { collectSecretsFromEnv, redactSecrets } from './lib/redact-secrets.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_PATH = path.join(ROOT, 'src/data/restaurants.json')
const PHOTOS_DIR = path.join(ROOT, 'public/photos')
const OUTSCRAPER_BASE = 'https://api.outscraper.cloud/google-maps-reviews'

loadEnvFile(path.join(ROOT, '.env'))

const API_KEY = process.env.OUTSCRAPER_API_KEY

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const slugArg = args.find((arg) => arg.startsWith('--slug='))?.split('=')[1]
const reviewsLimit = Number(
  args.find((arg) => arg.startsWith('--reviews-limit='))?.split('=')[1] ?? 50,
)
const locationLimit = Number(
  args.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? NaN,
)
const quotaBudget = Number(
  args.find((arg) => arg.startsWith('--quota-budget='))?.split('=')[1] ?? 500,
)
const delayMs = Number(args.find((arg) => arg.startsWith('--delay='))?.split('=')[1] ?? 500)

function safeMessage(message) {
  return redactSecrets(String(message), collectSecretsFromEnv())
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureApiKey() {
  if (!API_KEY) {
    console.error(
      'Missing OUTSCRAPER_API_KEY. Copy .env.example to .env and add your key.',
    )
    console.error('Sign up at https://outscraper.com/ — free tier includes 500 reviews/month.')
    process.exit(1)
  }
}

function toPublicPath(absolutePath) {
  return `/${path.relative(path.join(ROOT, 'public'), absolutePath).replace(/\\/g, '/')}`
}

function parseOutscraperDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10)

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) {
    const [, month, day, year] = match
    return `${year}-${month}-${day}`
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return new Date().toISOString().slice(0, 10)
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
  const merged = [...existing]

  for (const review of incoming) {
    const index = merged.findIndex((item) => item.sourceUrl === review.sourceUrl)
    if (index === -1) {
      merged.push(review)
      continue
    }

    if (review.imageUrl && !merged[index].imageUrl) {
      merged[index] = { ...merged[index], imageUrl: review.imageUrl }
    }
  }

  return rankReviews(merged)
}

async function downloadImage(url, destPath) {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`)
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const extension = contentType.includes('png') ? 'png' : 'jpg'
  const finalPath = destPath.replace(/\.(jpg|jpeg|png)$/i, `.${extension}`)

  fs.mkdirSync(path.dirname(finalPath), { recursive: true })
  fs.writeFileSync(finalPath, Buffer.from(await response.arrayBuffer()))

  return finalPath
}

async function fetchOutscraperReviews(placeId) {
  const params = new URLSearchParams({
    query: placeId,
    reviewsLimit: String(reviewsLimit),
    sort: 'lowest_rating',
    cutoffRating: '1',
    ignoreEmpty: 'true',
    async: 'false',
  })

  const response = await fetch(`${OUTSCRAPER_BASE}?${params}`, {
    headers: { 'X-API-KEY': API_KEY },
  })

  const body = await response.json()

  if (!response.ok) {
    const message = body.errorMessage ?? body.error ?? response.statusText
    throw new Error(safeMessage(`Outscraper error (${response.status}): ${message}`))
  }

  if (body.status === 'Failure') {
    throw new Error('Outscraper request failed with no results')
  }

  const place = body.data?.[0]
  if (!place) {
    return []
  }

  return place.reviews_data ?? []
}

function mapOutscraperReviews(rawReviews, restaurant) {
  return rawReviews
    .filter((review) => review.review_rating === 1)
    .map((review, index) => ({
      id: stableReviewId(restaurant.id, review.review_link),
      text: review.review_text.trim(),
      author: review.author_title ?? 'Google User',
      date: parseOutscraperDate(review.review_datetime_utc),
      rating: 1,
      funnyRank: index + 1,
      sourceUrl: review.review_link,
      imageUrl: undefined,
      _photoUrl:
        review.review_img_url ??
        review.review_img_urls?.[0] ??
        undefined,
    }))
    .filter((review) => Boolean(review.sourceUrl))
}

async function attachReviewPhotos(reviews, slug) {
  const updated = []

  for (const review of reviews) {
    const next = { ...review }
    delete next._photoUrl

    if (next.imageUrl || !review._photoUrl) {
      updated.push(next)
      continue
    }

    try {
      const dest = path.join(PHOTOS_DIR, slug, `${review.id}.jpg`)
      const saved = await downloadImage(review._photoUrl, dest)
      next.imageUrl = toPublicPath(saved)
    } catch (error) {
      console.warn(`  Review photo skipped (${review.id}): ${error.message}`)
    }

    updated.push(next)
  }

  return updated
}

async function ingestRestaurant(restaurant) {
  if (!restaurant.placeId) {
    throw new Error('Missing placeId — run Google Places ingest first')
  }

  console.log(`→ ${restaurant.name} (${restaurant.city})`)

  const rawReviews = await fetchOutscraperReviews(restaurant.placeId)
  const mapped = mapOutscraperReviews(rawReviews, restaurant)
  const merged = mergeReviews(restaurant.reviews ?? [], mapped)
  const withPhotos = await attachReviewPhotos(merged, restaurant.slug)

  const newCount = withPhotos.length - (restaurant.reviews?.length ?? 0)
  const photoCount = withPhotos.filter((review) => review.imageUrl).length

  console.log(
    `  Outscraper · ${rawReviews.length} low-rated fetched · +${Math.max(0, newCount)} new 1-star (${withPhotos.length} total)`,
  )
  console.log(`  photos · ${photoCount} review image(s)`)

  if (mapped.length === 0) {
    console.warn('  No new 1-star reviews returned for this location.')
  }

  return {
    ...restaurant,
    reviews: withPhotos,
  }
}

async function main() {
  ensureApiKey()

  const restaurants = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  let targets = slugArg
    ? restaurants.filter((restaurant) => restaurant.slug === slugArg)
    : [...restaurants].sort(
        (a, b) => (a.reviews?.length ?? 0) - (b.reviews?.length ?? 0),
      )

  const maxByQuota = Math.max(1, Math.floor(quotaBudget / reviewsLimit))
  const effectiveLimit = Number.isFinite(locationLimit)
    ? Math.min(locationLimit, maxByQuota)
    : maxByQuota

  if (!slugArg && effectiveLimit < targets.length) {
    console.log(
      `  Capping to ${effectiveLimit} location(s) (${reviewsLimit} reviews/location × ${effectiveLimit} = up to ${effectiveLimit * reviewsLimit} of ${quotaBudget} quota budget)`,
    )
    targets = targets.slice(0, effectiveLimit)
  } else if (!slugArg) {
    console.log(
      `  Processing ${targets.length} location(s) · up to ${targets.length * reviewsLimit} of ${quotaBudget} quota budget`,
    )
  }

  if (targets.length === 0) {
    console.error(slugArg ? `No restaurant found for slug: ${slugArg}` : 'No restaurants found')
    process.exit(1)
  }

  console.log(
    `Outscraper ingest for ${targets.length} location(s)${dryRun ? ' (dry run)' : ''}…`,
  )
  console.log(`  reviewsLimit=${reviewsLimit} per location\n`)

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

  const photosAdded = output.reduce((sum, restaurant, index) => {
    const before =
      restaurants[index].reviews?.filter((review) => review.imageUrl).length ?? 0
    const after = restaurant.reviews?.filter((review) => review.imageUrl).length ?? 0
    return sum + Math.max(0, after - before)
  }, 0)

  console.log(`\nDone. ${added} new review(s), ${photosAdded} new review photo(s).`)

  if (dryRun) {
    for (const restaurant of targets) {
      const updated = updatedBySlug.get(restaurant.slug) ?? restaurant
      console.log(`\n${restaurant.slug}: ${updated.reviews.length} review(s)`)
      for (const review of updated.reviews) {
        console.log(`  · ${review.author}: ${review.text.slice(0, 100)}${review.text.length > 100 ? '…' : ''}`)
        if (review.imageUrl) console.log(`    photo: ${review.imageUrl}`)
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
