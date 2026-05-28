#!/usr/bin/env node
/**
 * Basic security checks for local dev and CI.
 *
 * Usage: npm run security:check
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const failures = []

function fail(message) {
  failures.push(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function readIfExists(relativePath) {
  const fullPath = path.join(ROOT, relativePath)
  if (!fs.existsSync(fullPath)) return null
  return fs.readFileSync(fullPath, 'utf8')
}

try {
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)

  if (tracked.includes('.env')) {
    fail('.env is tracked by git — remove it and rotate any exposed keys')
  }

  for (const file of tracked) {
    if (file.startsWith('.env.') && file !== '.env.example') {
      fail(`${file} is tracked by git — env files must stay local`)
    }
  }

  const secretPatterns = [
    /SUPABASE_SERVICE_ROLE/,
    /VITE_SUPABASE_SERVICE/,
    /service_role['"]?\s*[:=]/i,
  ]

  const skipSecretScan = new Set([
    'README.md',
    'docs/OPERATIONS.md',
    'scripts/security-check.mjs',
  ])

  for (const file of tracked) {
    if (file.startsWith('supabase/migrations/')) continue
    if (skipSecretScan.has(file)) continue

    const contents = readIfExists(file)
    if (!contents) continue

    for (const pattern of secretPatterns) {
      if (pattern.test(contents)) {
        fail(`${file} references a Supabase service role key — use anon key only in the app`)
        break
      }
    }
  }
} catch {
  // Not a git repo or git unavailable — skip tracked-file checks
}

const envExample = read('.env.example')
if (
  /=(?:sk-|AIza|ZHAj)[A-Za-z0-9+/=_-]{12,}/.test(envExample) ||
  /eyJ[A-Za-z0-9+/=_-]{20,}/.test(envExample)
) {
  fail('.env.example appears to contain a real API key — use placeholders only')
}

if (/SERVICE_ROLE\s*=/.test(envExample)) {
  fail('.env.example must not reference Supabase service role keys')
}

const srcFiles = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      srcFiles.push(fullPath)
    }
  }
}
walk(path.join(ROOT, 'src'))

for (const file of srcFiles) {
  const contents = fs.readFileSync(file, 'utf8')
  const relative = path.relative(ROOT, file)

  if (/dangerouslySetInnerHTML/.test(contents)) {
    fail(`${relative} uses dangerouslySetInnerHTML`)
  }

  const envMatches = contents.match(/import\.meta\.env\.([A-Z0-9_]+)/g) ?? []
  const allowedClientEnv = new Set([
    'BASE_URL',
    'DEV',
    'PROD',
    'MODE',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ])
  for (const match of envMatches) {
    const key = match.split('.').pop()
    if (key && !allowedClientEnv.has(key)) {
      fail(`${relative} reads import.meta.env.${key} — secrets must not reach the client bundle`)
    }
  }
}

const safeExternalLink = read('src/components/SafeExternalLink.tsx')
if (!safeExternalLink.includes('sanitizeExternalUrl')) {
  fail('SafeExternalLink must sanitize href via sanitizeExternalUrl')
}

const securityMigration = read(
  'supabase/migrations/20260528120000_reactions_security.sql',
)
if (!securityMigration.includes('drop policy if exists "reaction_votes_public_read"')) {
  fail('Missing reactions security migration that drops public read policy')
}
if (!securityMigration.includes('revoke all on table public.reaction_votes')) {
  fail('Missing reactions security migration that revokes direct table access')
}

const clownOnlyMigration = read(
  'supabase/migrations/20260528150000_clown_only_reactions.sql',
)
if (!clownOnlyMigration.includes('get_top_reacted_reviews')) {
  fail('Clown-only migration must update get_top_reacted_reviews')
}
if (!clownOnlyMigration.includes("'laugh', 'sad', 'confused', 'shocked', 'dead', 'sick'")) {
  fail('Clown-only migration must whitelist clown reaction IDs')
}

const topReactedMigration = read(
  'supabase/migrations/20260528140000_top_reacted_reviews.sql',
)
if (!topReactedMigration.includes('grant execute on function public.get_top_reacted_reviews')) {
  fail('Top reacted migration must grant execute to anon/authenticated')
}

const cleanupMigration = read(
  'supabase/migrations/20260528160000_cleanup_legacy_reaction_votes.sql',
)
if (!cleanupMigration.includes('delete from public.reaction_votes')) {
  fail('Legacy reaction cleanup migration must delete non-clown reaction rows')
}

const downloadImageLib = read('scripts/lib/download-image.mjs')
if (!downloadImageLib.includes('assertSafeImageUrl')) {
  fail('scripts/lib/download-image.mjs must validate image URLs before fetch')
}

if (!read('index.html').includes('Content-Security-Policy')) {
  fail('index.html is missing a Content-Security-Policy meta tag')
}

try {
  execSync('npm audit --audit-level=moderate', {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  })
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim()
  fail(`npm audit reported moderate+ vulnerabilities:\n${output}`)
}

if (failures.length > 0) {
  console.error('Security check failed:\n')
  for (const message of failures) {
    console.error(`  ✗ ${message}`)
  }
  process.exit(1)
}

console.log('Security check passed.')
