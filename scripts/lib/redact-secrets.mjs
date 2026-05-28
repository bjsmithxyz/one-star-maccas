export function redactSecrets(text, secrets = []) {
  if (typeof text !== 'string') return String(text)

  let result = text
  for (const secret of secrets.filter(Boolean)) {
    if (secret.length < 8) continue
    result = result.split(secret).join('[REDACTED]')
  }

  return result
}

export function collectSecretsFromEnv() {
  return [
    process.env.GOOGLE_MAPS_API_KEY,
    process.env.OUTSCRAPER_API_KEY,
  ].filter(Boolean)
}
