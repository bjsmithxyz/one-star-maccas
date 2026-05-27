# 1 star maccas

The worst 1-star Google reviews from McDonald's around the world. English edition first.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Ingest real reviews

Google Places API returns up to **5 reviews per location** (official limit). The script filters for **1-star English** reviews with live Google Maps links.

### Setup

1. Create a [Google Cloud API key](https://console.cloud.google.com/google/maps-apis/credentials)
2. Enable **Places API (New)** (legacy Places API works as fallback)
3. Copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
# edit .env → GOOGLE_MAPS_API_KEY=...
```

### Run

```bash
# All 22 locations
npm run ingest

# Single location (good for testing)
npm run ingest -- --slug=times-square-nyc

# Preview without writing JSON
npm run ingest:dry -- --slug=times-square-nyc
```

The script will:
- Resolve each McDonald's on Google Maps and save `placeId`
- Pull real reviews with `sourceUrl` (live Google Maps link per review)
- Merge into `src/data/restaurants.json` without duplicates
- Rank by review length (`funnyRank`) — edit manually afterward if you prefer

**Note:** Most locations won't have a 1-star review in Google's top 5 returned results. Re-run periodically or add locations with more negative reviews. For full review history you'd need a paid scraper API (Outscraper, SerpAPI).

## Add reviews manually

Edit [`src/data/restaurants.json`](src/data/restaurants.json). Each review must be a real Google review with a live link — no placeholder or fabricated text.

```json
{
  "id": "r-001-1",
  "text": "Exact review text from Google",
  "author": "Reviewer name",
  "date": "2024-11-03",
  "rating": 1,
  "funnyRank": 1,
  "sourceUrl": "https://www.google.com/maps/reviews/..."
}
```

- `sourceUrl` is required — links to the live Google review
- `funnyRank`: `1` is funniest at that location
- `imageUrl` is optional — only use photos from the actual review

Reactions are stored in the visitor's browser only. Counts start at zero with no seeded data.

## Deploy

The build output is in `dist/`. Pushes to `master` deploy to GitHub Pages automatically.

Live site: https://bjsmithxyz.github.io/one-star-maccas/

## Disclaimer

Fan parody site — not affiliated with McDonald's Corporation. Reviews must be publicly posted user content with links to the original.
