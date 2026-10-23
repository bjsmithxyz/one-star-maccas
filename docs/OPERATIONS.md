# Operations guide

Internal runbook for updating **One Star Maccas**. For setup and security details, see the [README](../README.md).

Live site: https://bjsmithxyz.github.io/one-star-maccas/

## Architecture (30 seconds)

| Layer | What |
| --- | --- |
| Frontend | Vite + React SPA, data from `src/data/restaurants.json` |
| Deploy | Push to `master` → GitHub Actions → GitHub Pages |
| Ingest | Local Node scripts only; API keys stay in `.env` |
| Map tiles | CARTO Basemaps API key via `VITE_CARTO_API_KEY` locally; `VITE_CARTI_API_KEY` repository secret in CI |

Hero counts (`getSiteStats()` in `src/data/index.ts`) are derived from JSON — no manual counter edits.

---

## Ingest status (paused)

**Paid Google Places ingest is paused** until explicitly re-enabled. Do not run `npm run ingest` without owner approval.

**Nine locations intentionally have no reviews** (keep them in JSON, leave `reviews` empty):

`hobart-salamanca`, `christchurch-cashel`, `canary-wharf-london`, `camden-london`, `times-square-nyc-alt`, `union-square-nyc`, `warsaw-nowy-swiat`, `budapest-andrassy`, `athens-syntagma`

---

## Routine: ship a content update

```bash
npm run security:check
npm run build
git add src/data/restaurants.json public/photos/   # if changed
git commit -m "..."
git push origin master
```

CI runs lint, security checks, and the build on pull requests. Pushes to `master` build with `GITHUB_PAGES=true` and deploy. Allow ~30s.

**Before pushing:** never commit `.env`. Review `git diff` for accidental keys.

---

## Add a new restaurant

1. **Add the location with the entry script** (this updates `restaurants.json`, the route index, and review index together):

   ```bash
   npm run restaurant:add -- \\
     --slug=central-park-nyc \\
     --name="McDonald's Central Park" \\
     --city="New York" \\
     --country="United States" \\
     --flag=🇺🇸 \\
     --google-maps-url="https://maps.google.com/?cid=..." \\
     --place-id=ChIJ...
   ```

   Required fields are validated; use `--dry-run` to preview. Add `--lat` and `--lng` when known, or geocode afterwards.

2. **Fill reviews** (pick one):
   - **Google Places**: up to 5 reviews/location — [README § Google Places importer](../README.md#google-places-importer)
   - **Manual**: real text + `sourceUrl` per [README § Add reviews manually](../README.md#add-reviews-manually)

3. **Geocode** if missing coordinates:

   ```bash
   npm run geocode
   ```

4. **Verify locally:** `npm run dev` → check `/r/{slug}` and `/map`.

Review IDs must match `mcd-NNN-r-*` (use ingest scripts or `scripts/lib/review-id.mjs`).

---

## Batch import new restaurants and reviews

Create a local `scripts/places-targets.json` from the committed template, then preview and apply the official Google Places import:

```bash
cp scripts/places-targets.example.json scripts/places-targets.json
# edit the target list
npm run ingest:dry -- --input=scripts/places-targets.json
npm run ingest -- --input=scripts/places-targets.json
```

The importer resolves each place, adds new restaurant metadata, collects available 1-star reviews, downloads allowed photos, deduplicates by source URL, and regenerates all data indexes. Keep the target file local and do not run this while paid ingest is paused without approval.

Target format:

```json
{
  "slug": "central-park-nyc",
  "name": "McDonald's Central Park",
  "city": "New York",
  "country": "United States",
  "flag": "🇺🇸",
  "googleMapsUrl": "https://maps.google.com/?cid=..."
}
```

Use an existing slug to refresh it. New slugs require name, city, country, flag, and either `placeId` or `googleMapsUrl`.

## Add reviews to an existing restaurant

```bash
# Dry run first
npm run ingest:dry -- --slug=delancey-essex-nyc

# Apply
npm run ingest -- --slug=delancey-essex-nyc
```

The importer merges by `sourceUrl`, re-ranks by text length (`funnyRank`), and writes available photos to `public/photos/{slug}/`. Google Places returns up to five reviews per location.

---

## Change UI or behaviour

| Change | Where |
| --- | --- |
| Pages / routing | `src/pages/`, `src/App.tsx` |
| Review card, hero, map | `src/components/` |
| URL / slug validation | `src/lib/security.ts` |
| CSP | `index.html`, production strip in `vite.config.ts` |

After code changes: `npm run build` locally; CI must pass on push.

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Map missing pin | Restaurant needs numeric `lat` and `lng` |
| Ingest can’t find place | Set a valid `googleMapsUrl` or `placeId`, then retry the Google Places importer |
| Deploy failed | Actions log; run `npm run security:check` locally |

---

## npm scripts (quick reference)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run ingest` | Google Places ingest |
| `npm run ingest -- ...` | Google Places import |
| `npm run geocode` | Add lat/lng via Nominatim |
| `npm run restaurant:add -- ...` | Validate and add one restaurant entry |
| `npm run security:check` | Static security gates + `npm audit` (moderate+) |
| `npm run seo:generate` | Generate `robots.txt` and `sitemap.xml` |

Full option lists and API setup: [README](../README.md).
