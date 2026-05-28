import fs from 'node:fs'

export function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return

  const contents = fs.readFileSync(envPath, 'utf8')

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '')

    if (!(key in process.env) || process.env[key] === '' || process.env[key]?.startsWith('your_')) {
      process.env[key] = value
    }
  }
}
