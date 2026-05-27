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

## Add real reviews

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
