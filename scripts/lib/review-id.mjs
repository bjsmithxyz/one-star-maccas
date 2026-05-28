export function stableReviewId(restaurantId, sourceUrl) {
  let hash = 2166136261

  for (let index = 0; index < sourceUrl.length; index += 1) {
    hash ^= sourceUrl.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `${restaurantId}-r-${(hash >>> 0).toString(36)}`
}

/** Google review id embedded in Maps review URLs (stable across URL format variants). */
export function reviewSourceKey(sourceUrl) {
  if (!sourceUrl) return sourceUrl
  const match = sourceUrl.match(/1s([^!]+)/)
  return match ? match[1] : sourceUrl
}

export function mergeReviewRecords(current, incoming) {
  const preferCurrent =
    (current.imageUrl && !incoming.imageUrl) ||
    (Boolean(current.imageUrl) === Boolean(incoming.imageUrl) &&
      current.text.length > incoming.text.length) ||
    (Boolean(current.imageUrl) === Boolean(incoming.imageUrl) &&
      current.text.length === incoming.text.length &&
      (current.sourceUrl?.length ?? 0) >= (incoming.sourceUrl?.length ?? 0))

  const winner = preferCurrent ? current : incoming
  const loser = preferCurrent ? incoming : current

  return {
    ...winner,
    imageUrl: winner.imageUrl || loser.imageUrl,
    text: winner.text.length >= loser.text.length ? winner.text : loser.text,
    sourceUrl:
      (winner.sourceUrl?.length ?? 0) >= (loser.sourceUrl?.length ?? 0)
        ? winner.sourceUrl
        : loser.sourceUrl,
  }
}

export function dedupeReviewsBySource(reviews, restaurantId) {
  const byKey = new Map()

  for (const review of reviews) {
    if (!review.sourceUrl) continue

    const key = reviewSourceKey(review.sourceUrl)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, {
        ...review,
        id: review.id ?? stableReviewId(restaurantId, review.sourceUrl),
      })
      continue
    }

    byKey.set(key, mergeReviewRecords(existing, review))
  }

  return [...byKey.values()]
}
