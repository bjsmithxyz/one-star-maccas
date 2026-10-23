const DEFAULT_DESCRIPTION =
  "The worst 1-star Google reviews from McDonald's around the world."

type PageMetadata = {
  title: string
  description?: string
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  )

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.content = content
}

function setCanonical() {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }

  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  element.href = url.toString()
  setMeta('property', 'og:url', element.href)
}

export function updatePageMetadata({ title, description }: PageMetadata) {
  const pageDescription = description ?? DEFAULT_DESCRIPTION

  document.title = title
  setMeta('name', 'description', pageDescription)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', pageDescription)
  setCanonical()
}
