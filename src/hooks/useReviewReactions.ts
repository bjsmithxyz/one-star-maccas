import { useEffect, useState } from 'react'
import {
  ALL_REACTION_IDS,
  type ReactionId,
} from '../constants/reactions'

type ReviewReactionData = {
  added: Partial<Record<ReactionId, number>>
  mine: ReactionId[]
}

type ReactionStore = Record<string, ReviewReactionData>

const REACTIONS_KEY = '1-star-maccas-reactions-v4'

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
    ? data.mine.filter((id): id is ReactionId =>
        ALL_REACTION_IDS.includes(id as ReactionId),
      )
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
    ALL_REACTION_IDS.map((id) => [id, data.added[id] ?? 0]),
  ) as Record<ReactionId, number>
}

export function useReviewReactions(reviewId: string) {
  const [counts, setCounts] = useState<Record<ReactionId, number>>(() =>
    buildCounts(emptyReactionData()),
  )
  const [myReactions, setMyReactions] = useState<ReactionId[]>([])

  useEffect(() => {
    const stored = readStore()
    const data = normalizeReactionData(stored[reviewId] ?? emptyReactionData())

    setCounts(buildCounts(data))
    setMyReactions(data.mine)
  }, [reviewId])

  const toggleReaction = (reactionId: ReactionId) => {
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

export { PRIMARY_REACTIONS, EXTRA_EMOJI_REACTIONS } from '../constants/reactions'
