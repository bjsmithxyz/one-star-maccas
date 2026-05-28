/** First sentence (or full text if none found). */
export function firstSentence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^[\s\S]*?[.!?](?:\s|$)/)
  return match ? match[0].trim() : trimmed
}

export function hasMoreAfterFirstSentence(text: string): boolean {
  return firstSentence(text).length < text.trim().length
}
