#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const SITE_URL = 'https://bjsmithxyz.github.io/one-star-maccas'
const restaurants = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/restaurants-index.json'), 'utf8'),
)

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

const paths = ['/', '/map', ...restaurants.map(({ slug }) => `/r/${slug}`)]
const urls = paths
  .map(
    (pathname) => `  <url><loc>${escapeXml(`${SITE_URL}${pathname}`)}</loc></url>`,
  )
  .join('\n')

fs.mkdirSync(PUBLIC_DIR, { recursive: true })
fs.writeFileSync(
  path.join(PUBLIC_DIR, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`,
)
fs.writeFileSync(
  path.join(PUBLIC_DIR, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
)

console.log(`Generated SEO files for ${paths.length} URLs.`)
