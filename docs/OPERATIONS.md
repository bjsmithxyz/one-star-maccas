# Operations guide

Internal runbook for updating **1 star maccas**. For setup, security, and Supabase details, see the [README](../README.md).

Live site: https://bjsmithxyz.github.io/one-star-maccas/

## Architecture (30 seconds)

| Layer | What |
| --- | --- |
| Frontend | Vite + React SPA, data from `src/data/restaurants.json` |
| Deploy | Push to `master` → GitHub Actions → GitHub Pages |
| Reactions | Optional Supabase RPC + anon key baked in at build time |
| Ingest | Local Node scripts only; API keys stay in `.env` |

Hero counts (`getSiteStats()` in `src/data/index.ts`) are derived from JSON — no manual counter edits.

---

## Ingest status (paused)

**Paid ingest is paused** until explicitly re-enabled. Do not run `npm run ingest`, `npm run ingest:outscraper`, or `discover-locations` without owner approval.

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

CI runs `security:check`, builds with `GITHUB_PAGES=true`, and deploys. Allow ~30s.

**Before pushing:** never commit `.env`. Review `git diff` for accidental keys.

---

## Add a new restaurant

1. **Append** an object to [`src/data/restaurants.json`](../src/data/restaurants.json):
   - `id`: next `mcd-NNN` (three digits, zero-padded)
   - `slug`: `[a-z0-9-]` only (URL: `/r/{slug}`)
   - `name`, `city`, `country`, `flag`
   - `googleMapsUrl`: HTTPS Google Maps place link
   - `placeId`: Google Place ID, Maps short link, or leave empty until ingest
   - `lat` / `lng`: required for map pin (run geocode or set manually)
   - `reviews`: array (can start empty)

2. **Fill reviews** (pick one):
   - **Outscraper** (recommended): more 1-star reviews + photos — [README § Outscraper](../README.md#outscraper-more-reviews--photos)
   - **Google Places**: up to 5 reviews/location — [README § Google Places ingest](../README.md#google-places-ingest)
   - **Manual**: real text + `sourceUrl` per [README § Add reviews manually](../README.md#add-reviews-manually)

3. **Geocode** if missing coordinates:

   ```bash
   npm run geocode
   ```

4. **Verify locally:** `npm run dev` → check `/r/{slug}` and `/map`.

Review IDs must match `mcd-NNN-r-*` (use ingest scripts or `scripts/lib/review-id.mjs`). Supabase reactions reject other formats.

---

## Add reviews to an existing restaurant

```bash
# Dry run first
npm run ingest:outscraper:dry -- --slug=delancey-essex-nyc --reviews-limit=10

# Apply
npm run ingest:outscraper -- --slug=delancey-essex-nyc --reviews-limit=10
```

Scripts merge by `sourceUrl`, re-rank by text length (`funnyRank`), and write photos to `public/photos/{slug}/`.

Outscraper accepts `placeId` or `googleMapsUrl` (including `maps.app.goo.gl` links).

---

## Reactions / Supabase

- Local: copy [`.env.example`](../.env.example) → `.env`, set `VITE_SUPABASE_*` (anon key only — never `service_role`)
- Production: `github-pages` environment secrets (same var names)
- SQL migrations: run **all** files in [`supabase/migrations/`](../supabase/migrations/) in filename order (five files through `20260528160000_cleanup_legacy_reaction_votes.sql`)

Rate limiting options if RPC volume grows: see [README § Rate limiting](../README.md#rate-limiting-supabase-reactions).

See [README § Reactions](../README.md#reactions) and [README § Security](../README.md#security).

---

## Change UI or behaviour

| Change | Where |
| --- | --- |
| Pages / routing | `src/pages/`, `src/App.tsx` |
| Review card, hero, map | `src/components/` |
| Reaction emoji set | `src/constants/reactions.ts` (+ SQL whitelist in security migration) |
| URL / slug validation | `src/lib/security.ts` |
| CSP | `index.html`, production strip in `vite.config.ts` |

After code changes: `npm run build` locally; CI must pass on push.

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Reactions don’t persist live | GitHub `github-pages` env secrets; migrations applied |
| Reactions fail with `invalid review_id` | Review `id` must be `mcd-NNN-r-{hash}` from ingest |
| Map missing pin | Restaurant needs numeric `lat` and `lng` |
| Ingest can’t find place | Set `googleMapsUrl` or valid `placeId`; try Outscraper with Maps link |
| Deploy failed | Actions log; run `npm run security:check` locally |

---

## npm scripts (quick reference)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run ingest` | Google Places ingest |
| `npm run ingest:outscraper` | Outscraper ingest |
| `npm run geocode` | Add lat/lng via Nominatim |
| `npm run security:check` | Static security gates + `npm audit` (moderate+) |

Full option lists and API setup: [README](../README.md).
