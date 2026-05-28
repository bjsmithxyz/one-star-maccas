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
} catch {
  // Not a git repo or git unavailable — skip tracked-file checks
}

const envExample = read('.env.example')
if (/=(?:sk-|AIza|ZHAj)[A-Za-z0-9+/=_-]{12,}/.test(envExample)) {
  fail('.env.example appears to contain a real API key — use placeholders only')
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

if (!read('index.html').includes('Content-Security-Policy')) {
  fail('index.html is missing a Content-Security-Policy meta tag')
}

if (failures.length > 0) {
  console.error('Security check failed:\n')
  for (const message of failures) {
    console.error(`  ✗ ${message}`)
  }
  process.exit(1)
}

console.log('Security check passed.')
