#!/usr/bin/env node
/**
 * Recover review data from Outscraper request archives (read-only GET only).
 *
 * Does NOT trigger new scrapes or charge credits.
 *
 * Usage:
 *   npm run recover:outscraper
 *   npm run recover:outscraper -- --dry-run
 *   npm run recover:outscraper -- --slug=cairns-esplanade
 *   npm run recover:outscraper -- --days=14
 */

import { loadEnvFile } from './lib/load-env.mjs'
import { collectSecretsFromEnv, redactSecrets } from './lib/redact-secrets.mjs'
import {
  dedupeReviewsBySource,
  mergeReviewRecords,
  reviewSourceKey,
  stableReviewId,
} from './lib/review-id.mjs'
import { readRestaurants, writeRestaurants } from './lib/restaurant-data.mjs'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
loadEnvFile(`${ROOT}/.env`)

const API_KEY = process.env.OUTSCRAPER_API_KEY
const REQUESTS_BASE = 'https://api.outscraper.cloud/requests'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const slugArg = args.find((arg) => arg.startsWith('--slug='))?.split('=')[1]
const onlyEmpty = args.includes('--only-empty')
const days = Number(args.find((arg) => arg.startsWith('--days='))?.split('=')[1] ?? 14)
const delayMs = Number(args.find((arg) => arg.startsWith('--delay='))?.split('=')[1] ?? 100)
const concurrency = Number(
  args.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1] ?? 8,
)

function safeMessage(message) {
  return redactSecrets(String(message), collectSecretsFromEnv())
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureApiKey() {
  if (!API_KEY) {
    console.error('Missing OUTSCRAPER_API_KEY in .env')
    process.exit(1)
  }
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
    }))
    .filter((review) => Boolean(review.sourceUrl) && review.text.length > 0)
}

function mergeReviews(existing, incoming, restaurantId) {
  const merged = [...existing]

  for (const review of incoming) {
    const key = reviewSourceKey(review.sourceUrl)
    const index = merged.findIndex((item) => reviewSourceKey(item.sourceUrl) === key)
    if (index === -1) {
      merged.push(review)
      continue
    }

    merged[index] = mergeReviewRecords(merged[index], review)
  }

  return rankReviews(dedupeReviewsBySource(merged, restaurantId))
}

function buildPlaceIdIndex(restaurants) {
  const byPlaceId = new Map()

  for (const restaurant of restaurants) {
    const placeId = restaurant.placeId?.replace(/^places\//, '')
    if (placeId) {
      byPlaceId.set(placeId, restaurant)
    }
  }

  return byPlaceId
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'X-API-KEY': API_KEY },
  })

  const body = await response.json()

  if (!response.ok) {
    const message = body.errorMessage ?? body.error ?? response.statusText
    throw new Error(safeMessage(`Outscraper error (${response.status}): ${message}`))
  }

  return body
}

async function listFinishedRequests(sinceEpoch) {
  const items = []
  let page = 1

  while (page <= 20) {
    const body = await fetchJson(`${REQUESTS_BASE}?type=finished&page=${page}`)
    if (!body.items?.length) break

    for (const item of body.items) {
      if (item.start_date >= sinceEpoch) {
        items.push(item)
      }
    }

    if (!body.has_more) break
    page += 1
    await sleep(delayMs)
  }

  return items
}

async function mapWithConcurrency(items, limit, worker) {
  const results = []
  let index = 0

  async function runWorker() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current], current)
      if (delayMs > 0) await sleep(delayMs)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runWorker))
  return results
}

async function fetchArchive(requestId) {
  const body = await fetchJson(`${REQUESTS_BASE}/${requestId}`)
  if (body.status === 'Failure' || !body.data?.[0]) {
    return null
  }

  return body.data[0]
}

async function main() {
  ensureApiKey()

  const restaurants = readRestaurants()
  let targets = slugArg
    ? restaurants.filter((restaurant) => restaurant.slug === slugArg)
    : restaurants

  if (onlyEmpty && !slugArg) {
    targets = targets.filter((restaurant) => (restaurant.reviews?.length ?? 0) === 0)
  }

  if (slugArg && targets.length === 0) {
    console.error(`No restaurant found for slug: ${slugArg}`)
    process.exit(1)
  }

  const targetSlugs = new Set(targets.map((restaurant) => restaurant.slug))
  const byPlaceId = buildPlaceIdIndex(restaurants)
  const sinceEpoch = Date.now() / 1000 - days * 24 * 3600

  console.log(
    `Recovering from Outscraper archives (last ${days} days)${dryRun ? ' — dry run' : ''}…`,
  )

  const requestItems = await listFinishedRequests(sinceEpoch)
  console.log(`  ${requestItems.length} finished request(s) in window`)

  const incomingBySlug = new Map()
  let matchedArchives = 0

  const archiveResults = await mapWithConcurrency(requestItems, concurrency, async (item) => {
    try {
      const place = await fetchArchive(item.id)
      if (!place) return null

      const placeId = place.place_id ?? place.google_id
      const restaurant = byPlaceId.get(placeId)
      if (!restaurant || !targetSlugs.has(restaurant.slug)) return null

      const mapped = mapOutscraperReviews(place.reviews_data ?? [], restaurant)
      if (mapped.length === 0) return null

      return { slug: restaurant.slug, mapped }
    } catch (error) {
      console.warn(`  Archive ${item.id}: ${error.message}`)
      return null
    }
  })

  for (const result of archiveResults) {
    if (!result) continue
    matchedArchives += 1
    const existing = incomingBySlug.get(result.slug) ?? []
    incomingBySlug.set(result.slug, [...existing, ...result.mapped])
  }

  console.log(`  Matched ${matchedArchives} archive(s) to dataset locations`)

  let totalAdded = 0
  const output = restaurants.map((restaurant) => {
    const incoming = incomingBySlug.get(restaurant.slug)
    if (!incoming?.length) return restaurant

    const before = restaurant.reviews?.length ?? 0
    const merged = mergeReviews(restaurant.reviews ?? [], incoming, restaurant.id)
    const added = merged.length - before
    totalAdded += Math.max(0, added)

    if (added > 0 || before === 0) {
      console.log(`  ${restaurant.slug}: ${before} → ${merged.length} (+${Math.max(0, added)})`)
    }

    return { ...restaurant, reviews: merged }
  })

  console.log(`\nRecovery summary: +${totalAdded} review(s) from archives`)

  if (dryRun) {
    console.log('Dry run — no files written.')
    return
  }

  if (totalAdded === 0) {
    console.log('Nothing to write.')
    return
  }

  writeRestaurants(output)
  console.log('Updated restaurants.json and rebuilt split index files.')
}

main().catch((error) => {
  console.error(safeMessage(error instanceof Error ? error.message : String(error)))
  process.exit(1)
})
