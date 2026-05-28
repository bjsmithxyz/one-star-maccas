export function stableReviewId(restaurantId, sourceUrl) {
  let hash = 2166136261

  for (let index = 0; index < sourceUrl.length; index += 1) {
    hash ^= sourceUrl.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `${restaurantId}-r-${(hash >>> 0).toString(36)}`
}

export function dedupeReviewsBySource(reviews, restaurantId) {
  const bySource = new Map()

  for (const review of reviews) {
    if (!review.sourceUrl) continue

    const existing = bySource.get(review.sourceUrl)
    if (!existing) {
      bySource.set(review.sourceUrl, {
        ...review,
        id: stableReviewId(restaurantId, review.sourceUrl),
      })
      continue
    }

    if (review.imageUrl && !existing.imageUrl) {
      existing.imageUrl = review.imageUrl
    }
  }

  return [...bySource.values()]
}
