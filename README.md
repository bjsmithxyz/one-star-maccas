# 1 star maccas

The worst 1-star Google reviews from McDonald's around the world.

Live site: https://bjsmithxyz.github.io/one-star-maccas/

**Maintainers:** see [docs/OPERATIONS.md](docs/OPERATIONS.md) for how to add locations, ingest reviews, and deploy.

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
| `src/components/` | Review cards, reactions, Leaflet map, hero |
| `scripts/ingest-reviews.mjs` | Google Places ingest (placeId, up to 5 reviews/location) |
| `scripts/ingest-outscraper.mjs` | Outscraper ingest (more reviews + photos) |
| `scripts/geocode-locations.mjs` | Add `lat`/`lng` via OpenStreetMap Nominatim |
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

Interactive world map at `/map` using [Leaflet](https://leafletjs.com/) + OpenStreetMap tiles (no API key). Loaded lazily so the home page stays light.

## Site stats

Hero line (e.g. `22 restaurants · 269 reviews · view map`) comes from `getSiteStats()` in `src/data/index.ts` and updates automatically after ingest + rebuild.

## Reactions

Discord-style reaction bar on each review: six custom clown reactions. Counts are **shared globally** via [Supabase](https://supabase.com/) when configured.

### Supabase setup

1. Open your project SQL editor and run both migrations in order:
   - [`supabase/migrations/20260527120000_reactions.sql`](supabase/migrations/20260527120000_reactions.sql)
   - [`supabase/migrations/20260528120000_reactions_security.sql`](supabase/migrations/20260528120000_reactions_security.sql)
   - [`supabase/migrations/20260528140000_top_reacted_reviews.sql`](supabase/migrations/20260528140000_top_reacted_reviews.sql)
   - [`supabase/migrations/20260528150000_clown_only_reactions.sql`](supabase/migrations/20260528150000_clown_only_reactions.sql)
2. Copy the **anon/public** key from Project Settings → API
3. Add to `.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. For GitHub Pages, add the same values as **environment secrets** on the `github-pages` environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Each browser gets a random UUID in `localStorage` so you can toggle reactions without signing in. Counts refresh every ~45 seconds (and on tab focus) for all visitors. Direct table access is revoked — reads and writes go through RPC functions only.

**Known limitation:** without user sign-in, a determined actor could still stuff votes with random voter IDs. The security migration prevents enumerating other voters' IDs and reading raw vote rows.

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
  - Review IDs → `mcd-NNN-r-*` pattern before Supabase RPC calls
- `index.html` sets CSP, `Referrer-Policy`, and `X-Content-Type-Options`. Production builds strip dev-only `ws://localhost` CSP entries.
- Reaction votes are stored in Supabase; the anon key is public by design. Writes go through `toggle_review_reaction` RPC only — no direct table access for anon users.

Run automated checks locally:

```bash
npm run security:check
```

### CI / deploy

- GitHub Actions runs `npm run security:check` before every build.
- Workflow uses minimal permissions (`contents: read`, `pages: write`).
- Build injects `VITE_SUPABASE_*` from the `github-pages` environment secrets (anon key is public in the bundle by design).
- Ingest scripts redact API keys from error output and allowlist remote image hosts before download.
- Run `npm audit` periodically; address moderate+ findings.

### Data integrity

- Ingest scripts dedupe reviews by `sourceUrl` and generate stable IDs (`scripts/lib/review-id.mjs`).
- Do not add fabricated reviews or fake reaction counts.

## Deploy

Pushes to `master` deploy to GitHub Pages automatically via `.github/workflows/deploy-pages.yml`.

## Disclaimer

Fan parody site — not affiliated with McDonald's Corporation. Reviews must be publicly posted user content with links to the original.
