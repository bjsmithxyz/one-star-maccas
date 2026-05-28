const GOOGLE_HOSTS = ['google.com', 'googleusercontent.com', 'gstatic.com']

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null
    }
    return url
  } catch {
    return null
  }
}

function isAllowedHost(hostname: string, allowedHosts: string[]): boolean {
  const host = hostname.toLowerCase()
  return allowedHosts.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  )
}

export function sanitizeGoogleUrl(value: string | undefined): string {
  if (!value) return ''

  const url = parseHttpUrl(value)
  if (!url || !isAllowedHost(url.hostname, GOOGLE_HOSTS)) {
    return ''
  }

  return value
}

export function sanitizeGoogleReviewUrl(value: string | undefined): string {
  if (!value) return ''

  const url = parseHttpUrl(value)
  if (!url) return ''

  const host = url.hostname.toLowerCase()
  const allowed =
    host === 'google.com' ||
    host.endsWith('.google.com') ||
    host.endsWith('.googleusercontent.com')

  return allowed ? value : ''
}

export function sanitizeImageUrl(value: string | undefined): string {
  if (!value) return ''

  if (value.startsWith('/photos/') && !value.includes('..')) {
    return value
  }

  const url = parseHttpUrl(value)
  if (!url || url.protocol !== 'https:') {
    return ''
  }

  if (!isAllowedHost(url.hostname, ['googleusercontent.com', 'google.com'])) {
    return ''
  }

  return value
}

export function sanitizeSlug(value: string | undefined): string {
  if (!value) return ''
  return /^[a-z0-9-]+$/.test(value) ? value : ''
}
