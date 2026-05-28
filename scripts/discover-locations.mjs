#!/usr/bin/env node
/**
 * Discover McDonald's locations via Outscraper and append to restaurants.json.
 *
 * Usage:
 *   npm run discover:locations
 *   npm run discover:locations -- --dry-run
 *   npm run discover:locations -- --target=95
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './lib/load-env.mjs'
import { collectSecretsFromEnv, redactSecrets } from './lib/redact-secrets.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_PATH = path.join(ROOT, 'src/data/restaurants.json')
const OUTSCRAPER_SEARCH = 'https://api.outscraper.cloud/google-maps-search'

loadEnvFile(path.join(ROOT, '.env'))

const API_KEY = process.env.OUTSCRAPER_API_KEY

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const targetCount = Number(
  args.find((arg) => arg.startsWith('--target='))?.split('=')[1] ?? 95,
)
const delayMs = Number(args.find((arg) => arg.startsWith('--delay='))?.split('=')[1] ?? 400)

/** Curated high-traffic / tourist McDonald's search targets (slug must be unique). */
const SEED_LOCATIONS = [
  { slug: 'hollywood-blvd-la', searchQuery: "McDonald's Hollywood Boulevard Los Angeles", city: 'Los Angeles', country: 'United States', flag: '🇺🇸' },
  { slug: 'fishermans-wharf-sf', searchQuery: "McDonald's Fisherman's Wharf San Francisco", city: 'San Francisco', country: 'United States', flag: '🇺🇸' },
  { slug: 'south-beach-miami', searchQuery: "McDonald's Ocean Drive Miami Beach", city: 'Miami', country: 'United States', flag: '🇺🇸' },
  { slug: 'pike-place-seattle', searchQuery: "McDonald's Pike Place Seattle", city: 'Seattle', country: 'United States', flag: '🇺🇸' },
  { slug: 'downtown-dc', searchQuery: "McDonald's downtown Washington DC", city: 'Washington', country: 'United States', flag: '🇺🇸' },
  { slug: 'river-walk-san-antonio', searchQuery: "McDonald's San Antonio River Walk", city: 'San Antonio', country: 'United States', flag: '🇺🇸' },
  { slug: 'french-quarter-nola', searchQuery: "McDonald's French Quarter New Orleans", city: 'New Orleans', country: 'United States', flag: '🇺🇸' },
  { slug: 'honolulu-waikiki', searchQuery: "McDonald's Waikiki Honolulu", city: 'Honolulu', country: 'United States', flag: '🇺🇸' },
  { slug: 'atlanta-downtown', searchQuery: "McDonald's downtown Atlanta Peachtree", city: 'Atlanta', country: 'United States', flag: '🇺🇸' },
  { slug: 'denver-16th-street', searchQuery: "McDonald's 16th Street Mall Denver", city: 'Denver', country: 'United States', flag: '🇺🇸' },
  { slug: 'nashville-broadway', searchQuery: "McDonald's Broadway Nashville", city: 'Nashville', country: 'United States', flag: '🇺🇸' },
  { slug: 'austin-6th-street', searchQuery: "McDonald's 6th Street Austin", city: 'Austin', country: 'United States', flag: '🇺🇸' },
  { slug: 'phoenix-downtown', searchQuery: "McDonald's downtown Phoenix", city: 'Phoenix', country: 'United States', flag: '🇺🇸' },
  { slug: 'orlando-idrive', searchQuery: "McDonald's International Drive Orlando", city: 'Orlando', country: 'United States', flag: '🇺🇸' },
  { slug: 'detroit-downtown', searchQuery: "McDonald's downtown Detroit", city: 'Detroit', country: 'United States', flag: '🇺🇸' },
  { slug: 'minneapolis-nicollet', searchQuery: "McDonald's Nicollet Mall Minneapolis", city: 'Minneapolis', country: 'United States', flag: '🇺🇸' },
  { slug: 'portland-pioneer', searchQuery: "McDonald's Pioneer Courthouse Square Portland Oregon", city: 'Portland', country: 'United States', flag: '🇺🇸' },
  { slug: 'san-diego-gaslamp', searchQuery: "McDonald's Gaslamp Quarter San Diego", city: 'San Diego', country: 'United States', flag: '🇺🇸' },
  { slug: 'houston-downtown', searchQuery: "McDonald's downtown Houston Texas", city: 'Houston', country: 'United States', flag: '🇺🇸' },
  { slug: 'dallas-downtown', searchQuery: "McDonald's downtown Dallas", city: 'Dallas', country: 'United States', flag: '🇺🇸' },
  { slug: 'champs-elysees-paris', searchQuery: "McDonald's Champs-Élysées Paris", city: 'Paris', country: 'France', flag: '🇫🇷' },
  { slug: 'montmartre-paris', searchQuery: "McDonald's Montmartre Paris", city: 'Paris', country: 'France', flag: '🇫🇷' },
  { slug: 'dam-square-amsterdam', searchQuery: "McDonald's Dam Square Amsterdam", city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱' },
  { slug: 'alexanderplatz-berlin', searchQuery: "McDonald's Alexanderplatz Berlin", city: 'Berlin', country: 'Germany', flag: '🇩🇪' },
  { slug: 'marienplatz-munich', searchQuery: "McDonald's Marienplatz Munich", city: 'Munich', country: 'Germany', flag: '🇩🇪' },
  { slug: 'termini-rome', searchQuery: "McDonald's Termini Rome", city: 'Rome', country: 'Italy', flag: '🇮🇹' },
  { slug: 'duomo-milan', searchQuery: "McDonald's Piazza Duomo Milan", city: 'Milan', country: 'Italy', flag: '🇮🇹' },
  { slug: 'las-ramblas-barcelona', searchQuery: "McDonald's Las Ramblas Barcelona", city: 'Barcelona', country: 'Spain', flag: '🇪🇸' },
  { slug: 'puerta-del-sol-madrid', searchQuery: "McDonald's Puerta del Sol Madrid", city: 'Madrid', country: 'Spain', flag: '🇪🇸' },
  { slug: 'rossio-lisbon', searchQuery: "McDonald's Rossio Lisbon", city: 'Lisbon', country: 'Portugal', flag: '🇵🇹' },
  { slug: 'stephansplatz-vienna', searchQuery: "McDonald's Stephansplatz Vienna", city: 'Vienna', country: 'Austria', flag: '🇦🇹' },
  { slug: 'wenceslas-prague', searchQuery: "McDonald's Wenceslas Square Prague", city: 'Prague', country: 'Czech Republic', flag: '🇨🇿' },
  { slug: 'taksim-istanbul', searchQuery: "McDonald's Taksim Istanbul", city: 'Istanbul', country: 'Turkey', flag: '🇹🇷' },
  { slug: 'grand-place-brussels', searchQuery: "McDonald's Grand Place Brussels", city: 'Brussels', country: 'Belgium', flag: '🇧🇪' },
  { slug: 'bahnhofstrasse-zurich', searchQuery: "McDonald's Bahnhofstrasse Zurich", city: 'Zurich', country: 'Switzerland', flag: '🇨🇭' },
  { slug: 'promenade-nice', searchQuery: "McDonald's Promenade des Anglais Nice", city: 'Nice', country: 'France', flag: '🇫🇷' },
  { slug: 'old-town-stockholm', searchQuery: "McDonald's Gamla Stan Stockholm", city: 'Stockholm', country: 'Sweden', flag: '🇸🇪' },
  { slug: 'karl-johan-oslo', searchQuery: "McDonald's Karl Johans gate Oslo", city: 'Oslo', country: 'Norway', flag: '🇳🇴' },
  { slug: 'copenhagen-stroget', searchQuery: "McDonald's Strøget Copenhagen", city: 'Copenhagen', country: 'Denmark', flag: '🇩🇰' },
  { slug: 'helsinki-esplanadi', searchQuery: "McDonald's Esplanadi Helsinki", city: 'Helsinki', country: 'Finland', flag: '🇫🇮' },
  { slug: 'reykjavik-laugavegur', searchQuery: "McDonald's Laugavegur Reykjavik", city: 'Reykjavik', country: 'Iceland', flag: '🇮🇸' },
  { slug: 'birmingham-new-street', searchQuery: "McDonald's Birmingham New Street", city: 'Birmingham', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'liverpool-one', searchQuery: "McDonald's Liverpool ONE", city: 'Liverpool', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'leeds-trinity', searchQuery: "McDonald's Trinity Leeds", city: 'Leeds', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'bristol-harbourside', searchQuery: "McDonald's Bristol Harbourside", city: 'Bristol', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'brighton-pier', searchQuery: "McDonald's Brighton Pier", city: 'Brighton', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'belfast-city-centre', searchQuery: "McDonald's Belfast city centre", city: 'Belfast', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'cardiff-queen-street', searchQuery: "McDonald's Queen Street Cardiff", city: 'Cardiff', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'newcastle-northumberland', searchQuery: "McDonald's Northumberland Street Newcastle", city: 'Newcastle', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'shibuya-tokyo', searchQuery: "McDonald's Shibuya Tokyo", city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { slug: 'shinjuku-tokyo', searchQuery: "McDonald's Shinjuku Tokyo", city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { slug: 'dotonbori-osaka', searchQuery: "McDonald's Dotonbori Osaka", city: 'Osaka', country: 'Japan', flag: '🇯🇵' },
  { slug: 'myeongdong-seoul', searchQuery: "McDonald's Myeongdong Seoul", city: 'Seoul', country: 'South Korea', flag: '🇰🇷' },
  { slug: 'khao-san-bangkok', searchQuery: "McDonald's Khao San Road Bangkok", city: 'Bangkok', country: 'Thailand', flag: '🇹🇭' },
  { slug: 'central-hong-kong', searchQuery: "McDonald's Central Hong Kong", city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰' },
  { slug: 'ximending-taipei', searchQuery: "McDonald's Ximending Taipei", city: 'Taipei', country: 'Taiwan', flag: '🇹🇼' },
  { slug: 'bukit-bintang-kl', searchQuery: "McDonald's Bukit Bintang Kuala Lumpur", city: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾' },
  { slug: 'makati-manila', searchQuery: "McDonald's Ayala Makati Manila", city: 'Manila', country: 'Philippines', flag: '🇵🇭' },
  { slug: 'connaught-place-delhi', searchQuery: "McDonald's Connaught Place New Delhi", city: 'New Delhi', country: 'India', flag: '🇮🇳' },
  { slug: 'colaba-mumbai', searchQuery: "McDonald's Colaba Mumbai", city: 'Mumbai', country: 'India', flag: '🇮🇳' },
  { slug: 'orchard-road-singapore-alt', searchQuery: "McDonald's ION Orchard Singapore", city: 'Singapore', country: 'Singapore', flag: '🇸🇬' },
  { slug: 'dubai-mall', searchQuery: "McDonald's Dubai Mall", city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪' },
  { slug: 'yas-mall-abu-dhabi', searchQuery: "McDonald's Yas Mall Abu Dhabi", city: 'Abu Dhabi', country: 'United Arab Emirates', flag: '🇦🇪' },
  { slug: 'doha-corniche', searchQuery: "McDonald's Corniche Doha", city: 'Doha', country: 'Qatar', flag: '🇶🇦' },
  { slug: 'tel-aviv-dizengoff', searchQuery: "McDonald's Dizengoff Tel Aviv", city: 'Tel Aviv', country: 'Israel', flag: '🇮🇱' },
  { slug: 'v-a-waterfront-cape-town', searchQuery: "McDonald's V&A Waterfront Cape Town", city: 'Cape Town', country: 'South Africa', flag: '🇿🇦' },
  { slug: 'sandton-johannesburg', searchQuery: "McDonald's Sandton Johannesburg", city: 'Johannesburg', country: 'South Africa', flag: '🇿🇦' },
  { slug: 'tahrir-cairo', searchQuery: "McDonald's Tahrir Square Cairo", city: 'Cairo', country: 'Egypt', flag: '🇪🇬' },
  { slug: 'jema-el-fna-marrakech', searchQuery: "McDonald's Marrakech Medina", city: 'Marrakech', country: 'Morocco', flag: '🇲🇦' },
  { slug: 'zocalo-mexico-city', searchQuery: "McDonald's Zócalo Mexico City", city: 'Mexico City', country: 'Mexico', flag: '🇲🇽' },
  { slug: 'hotel-zone-cancun', searchQuery: "McDonald's Hotel Zone Cancun", city: 'Cancun', country: 'Mexico', flag: '🇲🇽' },
  { slug: 'copacabana-rio', searchQuery: "McDonald's Copacabana Rio de Janeiro", city: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷' },
  { slug: 'paulista-sao-paulo', searchQuery: "McDonald's Avenida Paulista São Paulo", city: 'São Paulo', country: 'Brazil', flag: '🇧🇷' },
  { slug: 'obelisco-buenos-aires', searchQuery: "McDonald's Obelisco Buenos Aires", city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { slug: 'providencia-santiago', searchQuery: "McDonald's Providencia Santiago Chile", city: 'Santiago', country: 'Chile', flag: '🇨🇱' },
  { slug: 'zona-rosa-bogota', searchQuery: "McDonald's Zona Rosa Bogotá", city: 'Bogotá', country: 'Colombia', flag: '🇨🇴' },
  { slug: 'miraflores-lima', searchQuery: "McDonald's Larcomar Miraflores Lima", city: 'Lima', country: 'Peru', flag: '🇵🇪' },
  { slug: 'el-poblado-medellin', searchQuery: "McDonald's El Poblado Medellín", city: 'Medellín', country: 'Colombia', flag: '🇨🇴' },
  { slug: 'montreal-sainte-catherine', searchQuery: "McDonald's Sainte-Catherine Montreal", city: 'Montreal', country: 'Canada', flag: '🇨🇦' },
  { slug: 'quebec-old-town', searchQuery: "McDonald's Old Quebec City", city: 'Quebec City', country: 'Canada', flag: '🇨🇦' },
  { slug: 'ottawa-byward', searchQuery: "McDonald's ByWard Market Ottawa", city: 'Ottawa', country: 'Canada', flag: '🇨🇦' },
  { slug: 'halifax-waterfront', searchQuery: "McDonald's Halifax waterfront", city: 'Halifax', country: 'Canada', flag: '🇨🇦' },
  { slug: 'gold-coast-surfers', searchQuery: "McDonald's Surfers Paradise Gold Coast", city: 'Gold Coast', country: 'Australia', flag: '🇦🇺' },
  { slug: 'cairns-esplanade', searchQuery: "McDonald's Cairns Esplanade", city: 'Cairns', country: 'Australia', flag: '🇦🇺' },
  { slug: 'hobart-salamanca', searchQuery: "McDonald's Salamanca Place Hobart", city: 'Hobart', country: 'Australia', flag: '🇦🇺' },
  { slug: 'christchurch-cashel', searchQuery: "McDonald's Cashel Street Christchurch", city: 'Christchurch', country: 'New Zealand', flag: '🇳🇿' },
  { slug: 'queenstown-lakefront', searchQuery: "McDonald's Queenstown lakefront", city: 'Queenstown', country: 'New Zealand', flag: '🇳🇿' },
  { slug: 'canary-wharf-london', searchQuery: "McDonald's Canary Wharf London", city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'camden-london', searchQuery: "McDonald's Camden London", city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'times-square-nyc-alt', searchQuery: "McDonald's 42nd Street New York", city: 'New York', country: 'United States', flag: '🇺🇸' },
  { slug: 'union-square-nyc', searchQuery: "McDonald's Union Square New York", city: 'New York', country: 'United States', flag: '🇺🇸' },
  { slug: 'pike-street-seattle-alt', searchQuery: "McDonald's Westlake Seattle", city: 'Seattle', country: 'United States', flag: '🇺🇸' },
  { slug: 'warsaw-nowy-swiat', searchQuery: "McDonald's Nowy Świat Warsaw", city: 'Warsaw', country: 'Poland', flag: '🇵🇱' },
  { slug: 'budapest-andrassy', searchQuery: "McDonald's Andrássy út Budapest", city: 'Budapest', country: 'Hungary', flag: '🇭🇺' },
  { slug: 'athens-syntagma', searchQuery: "McDonald's Syntagma Athens", city: 'Athens', country: 'Greece', flag: '🇬🇷' },
  { slug: 'dubrovnik-old-town', searchQuery: "McDonald's Dubrovnik old town", city: 'Dubrovnik', country: 'Croatia', flag: '🇭🇷' },
  { slug: 'split-riva', searchQuery: "McDonald's Split Riva", city: 'Split', country: 'Croatia', flag: '🇭🇷' },
  { slug: 'krakow-main-square', searchQuery: "McDonald's Main Square Krakow", city: 'Krakow', country: 'Poland', flag: '🇵🇱' },
  { slug: 'bucharest-unirii', searchQuery: "McDonald's Unirii Square Bucharest", city: 'Bucharest', country: 'Romania', flag: '🇷🇴' },
  { slug: 'ho-chi-minh-district-1', searchQuery: "McDonald's Nguyen Hue Ho Chi Minh City", city: 'Ho Chi Minh City', country: 'Vietnam', flag: '🇻🇳' },
  { slug: 'hanoi-old-quarter', searchQuery: "McDonald's Hanoi Old Quarter", city: 'Hanoi', country: 'Vietnam', flag: '🇻🇳' },
  { slug: 'bali-kuta', searchQuery: "McDonald's Kuta Bali", city: 'Kuta', country: 'Indonesia', flag: '🇮🇩' },
  { slug: 'jakarta-thamrin', searchQuery: "McDonald's Thamrin Jakarta", city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩' },
]

function safeMessage(message) {
  return redactSecrets(String(message), collectSecretsFromEnv())
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextRestaurantId(restaurants) {
  const max = restaurants.reduce((highest, restaurant) => {
    const value = Number.parseInt(restaurant.id.replace('mcd-', ''), 10)
    return Number.isFinite(value) ? Math.max(highest, value) : highest
  }, 0)

  return `mcd-${String(max + 1).padStart(3, '0')}`
}

async function searchPlace(query) {
  const params = new URLSearchParams({
    query,
    limit: '1',
    async: 'false',
  })

  const response = await fetch(`${OUTSCRAPER_SEARCH}?${params}`, {
    headers: { 'X-API-KEY': API_KEY },
  })

  const body = await response.json()

  if (!response.ok) {
    const message = body.errorMessage ?? body.error ?? response.statusText
    throw new Error(safeMessage(`Outscraper search error (${response.status}): ${message}`))
  }

  if (body.status === 'Failure') {
    return null
  }

  return body.data?.[0]?.[0] ?? null
}

async function main() {
  if (!API_KEY || API_KEY.startsWith('your_')) {
    console.error('Missing OUTSCRAPER_API_KEY in .env')
    process.exit(1)
  }

  const restaurants = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const existingSlugs = new Set(restaurants.map((restaurant) => restaurant.slug))
  const existingPlaceIds = new Set(
    restaurants.map((restaurant) => restaurant.placeId).filter(Boolean),
  )

  const candidates = SEED_LOCATIONS.filter((seed) => !existingSlugs.has(seed.slug))
  const toProcess = candidates.slice(0, targetCount)

  console.log(
    `Discovering up to ${toProcess.length} new location(s) via Outscraper${dryRun ? ' (dry run)' : ''}…\n`,
  )

  const discovered = []

  for (const seed of toProcess) {
    if (discovered.length >= targetCount) break

    try {
      const place = await searchPlace(seed.searchQuery)
      if (!place) {
        console.warn(`  ✗ ${seed.slug}: no place found`)
        continue
      }

      const placeId = place.place_id?.trim()
      if (!placeId || existingPlaceIds.has(placeId)) {
        console.warn(`  ✗ ${seed.slug}: duplicate or missing placeId`)
        continue
      }

      const displayName = place.name ?? `McDonald's ${seed.city}`
      const entry = {
        id: nextRestaurantId([...restaurants, ...discovered]),
        slug: seed.slug,
        name: displayName,
        city: seed.city,
        country: seed.country,
        flag: seed.flag,
        googleMapsUrl: place.location_link,
        placeId,
        reviews: [],
      }

      if (place.latitude != null && place.longitude != null) {
        entry.lat = Number(place.latitude)
        entry.lng = Number(place.longitude)
      }

      discovered.push(entry)
      existingPlaceIds.add(placeId)
      existingSlugs.add(seed.slug)

      console.log(`  ✓ ${seed.slug} → ${displayName}`)
      if (place.full_address ?? place.address) {
        console.log(`    ${place.full_address ?? place.address}`)
      }
    } catch (error) {
      console.error(`  ✗ ${seed.slug}: ${error.message}`)
    }

    await sleep(delayMs)
  }

  console.log(`\nDiscovered ${discovered.length} new location(s).`)

  if (dryRun || discovered.length === 0) {
    return
  }

  const output = [...restaurants, ...discovered]
  fs.writeFileSync(DATA_PATH, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Updated ${DATA_PATH} (${output.length} restaurants total)`)
}

main().catch((error) => {
  console.error(safeMessage(error instanceof Error ? error.message : String(error)))
  process.exit(1)
})
