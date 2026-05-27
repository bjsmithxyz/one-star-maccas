import { useEffect, useState } from 'react'
import type { ClownVariant } from '../components/ClownEmoji'

export const CLOWN_REACTIONS: {
  id: ClownVariant
  label: string
}[] = [
  { id: 'happy', label: 'Happy clown' },
  { id: 'sad', label: 'Sad clown' },
  { id: 'confused', label: 'Confused clown' },
  { id: 'angry', label: 'Angry clown' },
  { id: 'shocked', label: 'Shocked clown' },
  { id: 'dead', label: 'Dead clown' },
  { id: 'sick', label: 'Sick clown' },
]

type ReviewReactionData = {
  added: Partial<Record<ClownVariant, number>>
  mine: ClownVariant[]
}

type ReactionStore = Record<string, ReviewReactionData>

const REACTIONS_KEY = '1-star-maccas-reactions-v2'

function readStore(): ReactionStore {
  try {
    const raw = localStorage.getItem(REACTIONS_KEY)
    const parsed = raw ? (JSON.parse(raw) as ReactionStore) : {}

    for (const [reviewId, data] of Object.entries(parsed)) {
      if (!Array.isArray(data.mine)) {
        parsed[reviewId] = normalizeReactionData(data)
      }
    }

    return parsed
  } catch {
    return {}
  }
}

function normalizeReactionData(data: Partial<ReviewReactionData>): ReviewReactionData {
  const mine = Array.isArray(data.mine)
    ? data.mine
    : data.mine && typeof data.mine === 'object'
      ? (Object.entries(data.mine as Partial<Record<ClownVariant, number>>)
          .filter(([, count]) => (count ?? 0) > 0)
          .map(([id]) => id) as ClownVariant[])
      : []

  const added = { ...(data.added ?? {}) }
  for (const id of mine) {
    if ((added[id] ?? 0) < 1) {
      added[id] = 1
    }
  }

  return { added, mine }
}

function writeStore(value: ReactionStore) {
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(value))
}

function emptyReactionData(): ReviewReactionData {
  return { added: {}, mine: [] }
}

function buildCounts(data: ReviewReactionData) {
  return Object.fromEntries(
    CLOWN_REACTIONS.map(({ id }) => [id, data.added[id] ?? 0]),
  ) as Record<ClownVariant, number>
}

export function useReviewReactions(reviewId: string) {
  const [counts, setCounts] = useState<Record<ClownVariant, number>>(() =>
    buildCounts(emptyReactionData()),
  )
  const [myReactions, setMyReactions] = useState<ClownVariant[]>([])

  useEffect(() => {
    const stored = readStore()
    const data = normalizeReactionData(stored[reviewId] ?? emptyReactionData())

    setCounts(buildCounts(data))
    setMyReactions(data.mine)
  }, [reviewId])

  const toggleReaction = (reactionId: ClownVariant) => {
    const stored = readStore()
    const data = normalizeReactionData(stored[reviewId] ?? emptyReactionData())
    const hasReaction = data.mine.includes(reactionId)

    if (hasReaction) {
      data.mine = data.mine.filter((id) => id !== reactionId)
      data.added[reactionId] = Math.max(0, (data.added[reactionId] ?? 0) - 1)
    } else {
      data.mine = [...data.mine, reactionId]
      data.added[reactionId] = (data.added[reactionId] ?? 0) + 1
    }

    stored[reviewId] = data
    writeStore(stored)

    setCounts(buildCounts(data))
    setMyReactions([...data.mine])
  }

  return { counts, myReactions, toggleReaction }
}
