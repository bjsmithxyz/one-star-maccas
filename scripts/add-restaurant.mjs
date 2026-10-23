#!/usr/bin/env node
/**
 * Add one restaurant entry and regenerate the split data files.
 *
 * Usage:
 *   npm run restaurant:add -- \
 *     --slug=central-park-nyc \
 *     --name="McDonald's Central Park" \
 *     --city="New York" \
 *     --country="United States" \
 *     --flag=🇺🇸 \
 *     --google-maps-url="https://maps.google.com/?cid=..." \
 *     --place-id=ChIJ...
 *
 * Add --dry-run to preview the generated entry without writing files.
 */

import { readRestaurants, writeRestaurants } from './lib/restaurant-data.mjs'

const VALUE_OPTIONS = new Set([
  'slug',
  'name',
  'city',
  'country',
  'flag',
  'google-maps-url',
  'place-id',
  'lat',
  'lng',
])

function printUsage() {
  console.log(`Usage: npm run restaurant:add -- [options]

Required:
  --slug=...                 URL-safe slug
  --name=...                 Restaurant name
  --city=...                 City
  --country=...              Country
  --flag=...                 Country flag emoji
  --google-maps-url=...      HTTPS Google Maps place URL

Optional:
  --place-id=...             Google Place ID
  --lat=... --lng=...         Coordinates
  --dry-run                  Preview without writing files
  --help                     Show this help`)
}

function parseArgs(argv) {
  const values = {}
  let dryRun = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--dry-run') {
      dryRun = true
      continue
    }
    if (argument === '--help' || argument === '-h') {
      printUsage()
      process.exit(0)
    }
    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument}`)
    }

    const equalsIndex = argument.indexOf('=')
    const key = argument.slice(2, equalsIndex === -1 ? undefined : equalsIndex)
    if (!VALUE_OPTIONS.has(key)) {
      throw new Error(`Unknown option: --${key}`)
    }

    let value = equalsIndex === -1 ? argv[index + 1] : argument.slice(equalsIndex + 1)
    if (equalsIndex === -1) index += 1
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }
    values[key] = value
  }

  return { values, dryRun }
}

function requireValue(values, key) {
  const value = values[key]?.trim()
  if (!value) throw new Error(`Missing required option: --${key}`)
  return value
}

function parseCoordinate(values, key) {
  if (values[key] === undefined) return undefined
  const coordinate = Number(values[key])
  if (!Number.isFinite(coordinate)) {
    throw new Error(`--${key} must be a number`)
  }
  return coordinate
}

function validateGoogleMapsUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('--google-maps-url must be a valid URL')
  }

  const hostname = url.hostname.toLowerCase()
  const isGoogleHost =
    hostname === 'google.com' ||
    hostname.endsWith('.google.com') ||
    hostname.startsWith('google.') ||
    hostname === 'goo.gl' ||
    hostname === 'maps.app.goo.gl'

  if (url.protocol !== 'https:' || !isGoogleHost) {
    throw new Error('--google-maps-url must be an HTTPS Google Maps URL')
  }
}

function nextRestaurantId(restaurants) {
  const max = restaurants.reduce((highest, restaurant) => {
    const match = /^mcd-(\d+)$/.exec(restaurant.id ?? '')
    const value = match ? Number(match[1]) : 0
    return Number.isFinite(value) ? Math.max(highest, value) : highest
  }, 0)

  return `mcd-${String(max + 1).padStart(3, '0')}`
}

function buildEntry(values, restaurants) {
  const slug = requireValue(values, 'slug')
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('--slug may contain only lowercase letters, numbers, and hyphens')
  }
  if (restaurants.some((restaurant) => restaurant.slug === slug)) {
    throw new Error(`A restaurant with slug "${slug}" already exists`)
  }

  const googleMapsUrl = requireValue(values, 'google-maps-url')
  validateGoogleMapsUrl(googleMapsUrl)

  const lat = parseCoordinate(values, 'lat')
  const lng = parseCoordinate(values, 'lng')
  if ((lat === undefined) !== (lng === undefined)) {
    throw new Error('--lat and --lng must be provided together')
  }
  if (lat !== undefined && (lat < -90 || lat > 90)) {
    throw new Error('--lat must be between -90 and 90')
  }
  if (lng !== undefined && (lng < -180 || lng > 180)) {
    throw new Error('--lng must be between -180 and 180')
  }

  const entry = {
    id: nextRestaurantId(restaurants),
    slug,
    name: requireValue(values, 'name'),
    city: requireValue(values, 'city'),
    country: requireValue(values, 'country'),
    flag: requireValue(values, 'flag'),
    googleMapsUrl,
    reviews: [],
  }

  if (values['place-id']) entry.placeId = values['place-id'].trim()
  if (lat !== undefined && lng !== undefined) {
    entry.lat = lat
    entry.lng = lng
  }

  return entry
}

function main() {
  const { values, dryRun } = parseArgs(process.argv.slice(2))
  const restaurants = readRestaurants()
  const entry = buildEntry(values, restaurants)

  console.log(`${dryRun ? 'Would add' : 'Adding'} ${entry.id}: ${entry.name} (${entry.slug})`)

  if (dryRun) {
    console.log(JSON.stringify(entry, null, 2))
    return
  }

  writeRestaurants([...restaurants, entry])
  console.log('Updated restaurants.json, restaurants-index.json, and review-index.json.')
}

try {
  main()
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
