# 1-Star McD's

A fun static site collating the funniest 1-star Google reviews from McDonald's locations around the world. English edition first.

**Golden Arches, Broken Dreams.**

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

## Add restaurants or reviews

Edit [`src/data/restaurants.json`](src/data/restaurants.json):

- Each restaurant needs a unique `slug` (used in URLs like `/r/times-square-nyc`).
- Add 1-star reviews with `funnyRank` — `1` is funniest at that location.
- The home page featured feed pulls reviews sorted by `funnyRank`.

## Deploy

The build output is in `dist/`. Deploy to any static host (Netlify, Cloudflare Pages, GitHub Pages).

For client-side routing, configure SPA fallback:

- **Netlify / Cloudflare:** `public/_redirects` is included (`/* /index.html 200`)
- **GitHub Pages:** add a `404.html` copy of `index.html` or use your host's SPA setting

## Disclaimer

Fan parody site — not affiliated with McDonald's Corporation. Reviews are publicly posted user content, curated for entertainment.
