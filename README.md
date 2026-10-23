# One Star Maccas

The worst 1-star Google reviews from McDonald's around the world.

Live site: https://bjsmithxyz.github.io/one-star-maccas/

**Maintainers:** see [docs/OPERATIONS.md](docs/OPERATIONS.md) for how to add locations, ingest reviews, and deploy. Paid Outscraper/Google ingest is currently paused; nine map locations are intentionally empty (see Operations).

## License

Site code is released under the [MIT License](LICENSE).

Review text and photos remain the property of their respective authors and Google. This project curates and links to publicly available content for commentary and entertainment only. Not affiliated with McDonald's Corporation.

## Stack

- Vite + React + TypeScript + Tailwind
- Static JSON dataset (`src/data/restaurants.json`)
- GitHub Pages deploy on push to `master`

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

## Project layout

| Path | Purpose |
| --- | --- |
| `src/pages/` | Home, restaurant detail, map, 404 |
| `src/data/` | JSON dataset + helpers (`getSiteStats`, `getMapRestaurants`) |
| `src/components/` | Review cards, Leaflet map, hero |
| `scripts/ingest-reviews.mjs` | Google Places ingest (placeId, up to 5 reviews/location) |
| `scripts/ingest-outscraper.mjs` | Outscraper ingest (more reviews + photos) |
| `scripts/geocode-locations.mjs` | Add `lat`/`lng` via OpenStreetMap Nominatim |
| `scripts/generate-seo.mjs` | Generate `robots.txt` and `sitemap.xml` |
| `public/photos/` | Downloaded place and review images |

## Ingest real reviews

Google Places API returns up to **5 reviews per location** (official limit). The script filters for **1-star** reviews with live Google Maps links (any language).

### Setup

1. Create a [Google Cloud API key](https://console.cloud.google.com/google/maps-apis/credentials)
2. Enable **Places API (New)** (legacy Places API works as fallback)
3. Copy `.env.example` to `.env` and add your keys locally:

```bash
cp .env.example .env
# edit .env — never commit this file
```

### Google Places ingest

```bash
npm run ingest
npm run ingest -- --slug=times-square-nyc
npm run ingest:dry -- --slug=times-square-nyc
```

### Outscraper (more reviews + photos)

[Outscraper](https://outscraper.com/google-maps-reviews-api/) fetches many more low-rated reviews and includes `review_img_url` for hero overlays. Free tier: **500 reviews/month**.

```bash
npm run ingest:outscraper -- --reviews-limit=10 --quota-budget=490
npm run ingest:outscraper:dry -- --slug=times-square-nyc
```

Both ingest scripts merge by `sourceUrl`, assign stable review IDs, download photos to `public/photos/{slug}/`, and rank by review length (`funnyRank`).

### Geocode locations

```bash
npm run geocode
```

Adds `lat`/`lng` to each restaurant for the map page (~1 Nominatim request/sec).

## Map

Interactive world map at `/map` using [Leaflet](https://leafletjs.com/) + CARTO raster tiles. CARTO requires a Basemaps API key: add `VITE_CARTO_API_KEY=...` to your local `.env`, and add the repository secret `VITE_CARTI_API_KEY` for production. The workflow maps that secret to the frontend variable. The key is public in the browser bundle, so restrict it to your site domains in CARTO. Google Places ingest uses the separate `GOOGLE_MAPS_API_KEY`. Loaded lazily so the home page stays light.

## SEO

The build generates `robots.txt` and a sitemap covering the home page, map, and every restaurant route. Page titles, descriptions, canonical URLs, and Open Graph metadata update for each route.

## Site stats

Hero line (e.g. `22 restaurants · 269 reviews · view map`) comes from `getSiteStats()` in `src/data/index.ts` and updates automatically after ingest + rebuild.

## Add reviews manually

Edit [`src/data/restaurants.json`](src/data/restaurants.json). Each review must be a real Google review with a live link.

```json
{
  "id": "mcd-001-r-abc123",
  "text": "Exact review text from Google",
  "author": "Reviewer name",
  "date": "2024-11-03",
  "rating": 1,
  "funnyRank": 1,
  "sourceUrl": "https://www.google.com/maps/reviews/..."
}
```

- `sourceUrl` is required — must be a Google Maps HTTPS link
- `funnyRank`: `1` is funniest at that location
- `imageUrl` is optional — only use photos from the actual review

## Security

This is a **static site** with no backend. Attack surface is small, but keep these practices in mind:

### Secrets

- **Never commit `.env`** — it is gitignored. Only placeholders live in `.env.example`.
- API keys (`GOOGLE_MAPS_API_KEY`, `OUTSCRAPER_API_KEY`) are used **only in Node ingest scripts**, never bundled into the frontend.
- Restrict Google Cloud keys to Places API only; use IP restriction for local ingest or a separate key per developer.
- Rotate any key immediately if it is pasted into chat, committed by mistake, or exposed in a PR.

### Frontend

- Review text is rendered as React text nodes (auto-escaped) — no `dangerouslySetInnerHTML`.
- External links use `SafeExternalLink`, which validates HTTPS Google URLs internally and sets `rel="noopener noreferrer"`.
- URLs are validated in `src/lib/security.ts` (HTTPS-only):
  - External links → Google domains only
  - Images → `/photos/*` paths or `https://*.googleusercontent.com`
  - Route slugs → `[a-z0-9-]` only
- `index.html` sets CSP, `Referrer-Policy`, and `X-Content-Type-Options`. Production builds strip dev-only `ws://localhost` CSP entries.

Run automated checks locally:

```bash
npm run security:check
```

This runs static checks plus `npm audit --audit-level=moderate`.

### CI / deploy

- GitHub Actions runs `npm run lint`, `npm run security:check` (includes `npm audit`), and `npm run build` on pull requests.
- Deployments use `npm ci`; action references are pinned to reviewed commit SHAs. Dependabot monitors npm and GitHub Actions updates.
- Workflow uses minimal permissions (`contents: read`, `pages: write`).
- Ingest scripts redact API keys from error output and allowlist remote image hosts before download.

### Data integrity

- Ingest scripts dedupe reviews by `sourceUrl` and generate stable IDs (`scripts/lib/review-id.mjs`).
- Do not add fabricated reviews.

## Deploy

Pushes to `master` deploy to GitHub Pages automatically via `.github/workflows/deploy-pages.yml`.

## Disclaimer

Fan parody site — not affiliated with McDonald's Corporation. Reviews must be publicly posted user content with links to the original.
