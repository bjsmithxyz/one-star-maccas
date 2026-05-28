/** First sentence (or full text if none found). */
export function firstSentence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^[\s\S]*?[.!?](?:\s|$)/)
  return match ? match[0].trim() : trimmed
}

function secondSentence(text: string): string {
  const trimmed = text.trim()
  const first = firstSentence(trimmed)
  const rest = trimmed.slice(first.length).trim()
  if (!rest) return ''

  const match = rest.match(/^[\s\S]*?[.!?](?:\s|$)/)
  return match ? match[0].trim() : rest
}

function firstHalfAtWord(text: string): string {
  if (!text) return ''

  const halfLen = Math.ceil(text.length / 2)
  let half = text.slice(0, halfLen).trimEnd()
  const lastSpace = half.lastIndexOf(' ')

  if (lastSpace > 0 && half.length < text.length) {
    half = half.slice(0, lastSpace)
  }

  return half
}

/** First sentence plus the first half of the second sentence (leaderboard cards). */
export function leaderboardPreview(text: string): string {
  const trimmed = text.trim()
  const first = firstSentence(trimmed)
  const second = secondSentence(trimmed)
  if (!second) return first

  const halfSecond = firstHalfAtWord(second)
  if (!halfSecond) return first

  return `${first} ${halfSecond}`
}

export function hasMoreAfterFirstSentence(text: string): boolean {
  return firstSentence(text).length < text.trim().length
}

export function hasMoreAfterLeaderboardPreview(text: string): boolean {
  return leaderboardPreview(text).length < text.trim().length
}
