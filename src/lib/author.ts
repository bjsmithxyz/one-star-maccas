/** Show review authors as initials (e.g. "Jane Doe" → "J. D."). */
export function formatAuthorInitials(author: string): string {
  const trimmed = author.trim()
  if (!trimmed) return 'Anonymous'

  const initials = trimmed
    .split(/\s+/)
    .map((word) => {
      const match = word.match(/\p{L}|\p{N}/u)
      return match ? `${match[0].toUpperCase()}.` : ''
    })
    .filter(Boolean)

  return initials.length > 0 ? initials.join(' ') : 'Anonymous'
}
