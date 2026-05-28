const GOOGLE_HOSTS = ['google.com', 'googleusercontent.com', 'gstatic.com']

function parseHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') {
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

function isGoogleHost(hostname: string): boolean {
  return isAllowedHost(hostname, GOOGLE_HOSTS)
}

/** HTTPS Google URLs (Maps, review links, etc.). */
export function sanitizeGoogleUrl(value: string | undefined): string {
  if (!value) return ''

  const url = parseHttpsUrl(value)
  if (!url || !isGoogleHost(url.hostname)) {
    return ''
  }

  return value
}

/** @deprecated Use sanitizeGoogleUrl — same rules apply to review links. */
export function sanitizeGoogleReviewUrl(value: string | undefined): string {
  return sanitizeGoogleUrl(value)
}

/** Any external link rendered in the app (currently Google-only). */
export function sanitizeExternalUrl(value: string | undefined): string {
  return sanitizeGoogleUrl(value)
}

export function sanitizeImageUrl(value: string | undefined): string {
  if (!value) return ''

  if (value.startsWith('/photos/') && !value.includes('..')) {
    return value
  }

  const url = parseHttpsUrl(value)
  if (!url) {
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

export const REVIEW_ID_PATTERN = /^mcd-[0-9]{3}-r-[a-z0-9]+$/

export function isValidReviewId(value: string): boolean {
  return REVIEW_ID_PATTERN.test(value)
}
