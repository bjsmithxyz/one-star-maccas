export function reviewOwnsImageUrl(review: {
  id: string
  imageUrl?: string
}): boolean {
  if (!review.imageUrl) return false
  const filename = review.imageUrl.split('/').pop() ?? ''
  return filename.startsWith(review.id)
}
