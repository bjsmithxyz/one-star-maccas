import path from 'node:path'

const ALLOWED_IMAGE_HOSTS = [
  'googleusercontent.com',
  'google.com',
  'ggpht.com',
]

function isPrivateOrLocalHost(hostname) {
  const host = hostname.toLowerCase()

  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host === '::1' || host.startsWith('fe80:')) return true

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split('.').map(Number)
    if (a === 127 || a === 10) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
    return true
  }

  return false
}

function isAllowedImageHost(hostname) {
  const host = hostname.toLowerCase()
  if (isPrivateOrLocalHost(host)) return false

  return ALLOWED_IMAGE_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  )
}

export function assertSafeImageUrl(urlString) {
  let url
  try {
    url = new URL(urlString)
  } catch {
    throw new Error('Invalid image URL')
  }

  if (url.protocol !== 'https:') {
    throw new Error('Image URL must use HTTPS')
  }

  if (!isAllowedImageHost(url.hostname)) {
    throw new Error(`Image host not allowed: ${url.hostname}`)
  }
}

export async function downloadImage(url, destPath, fs) {
  assertSafeImageUrl(url)

  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`)
  }

  const finalUrl = new URL(response.url)
  assertSafeImageUrl(finalUrl.toString())

  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const extension = contentType.includes('png') ? 'png' : 'jpg'
  const finalPath = destPath.replace(/\.(jpg|jpeg|png)$/i, `.${extension}`)

  fs.mkdirSync(path.dirname(finalPath), { recursive: true })
  fs.writeFileSync(finalPath, Buffer.from(await response.arrayBuffer()))

  return finalPath
}
