import { useCallback, useEffect, useState } from 'react'
import {
  ALL_REACTION_IDS,
  type ReactionId,
} from '../constants/reactions'
import {
  fetchReviewReactions,
  isSupabaseConfigured,
  toggleReviewReaction,
} from '../lib/supabase'

const POLL_INTERVAL_MS = 45_000

function emptyCounts(): Record<ReactionId, number> {
  return Object.fromEntries(
    ALL_REACTION_IDS.map((id) => [id, 0]),
  ) as Record<ReactionId, number>
}

function buildCounts(counts: Record<string, number>): Record<ReactionId, number> {
  const next = emptyCounts()
  for (const id of ALL_REACTION_IDS) {
    next[id] = counts[id] ?? 0
  }
  return next
}

function buildMine(mine: string[]): ReactionId[] {
  return mine.filter((id): id is ReactionId =>
    ALL_REACTION_IDS.includes(id as ReactionId),
  )
}

export function useReviewReactions(reviewId: string) {
  const [counts, setCounts] = useState<Record<ReactionId, number>>(emptyCounts)
  const [myReactions, setMyReactions] = useState<ReactionId[]>([])
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured())
  const [isSyncing, setIsSyncing] = useState(false)

  const applyPayload = useCallback((payload: { counts: Record<string, number>; mine: string[] }) => {
    setCounts(buildCounts(payload.counts))
    setMyReactions(buildMine(payload.mine))
  }, [])

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    try {
      const payload = await fetchReviewReactions(reviewId)
      if (payload) applyPayload(payload)
    } catch (error) {
      console.error('Failed to load reactions', error)
    } finally {
      setIsLoading(false)
    }
  }, [applyPayload, reviewId])

  useEffect(() => {
    setIsLoading(isSupabaseConfigured())
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const poll = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    const interval = window.setInterval(poll, POLL_INTERVAL_MS)
    window.addEventListener('focus', poll)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', poll)
    }
  }, [refresh])

  const toggleReaction = async (reactionId: ReactionId) => {
    if (!isSupabaseConfigured()) return

    const previousCounts = counts
    const previousMine = myReactions
    const hasReaction = myReactions.includes(reactionId)

    setIsSyncing(true)
    setMyReactions(
      hasReaction
        ? myReactions.filter((id) => id !== reactionId)
        : [...myReactions, reactionId],
    )
    setCounts({
      ...counts,
      [reactionId]: Math.max(0, counts[reactionId] + (hasReaction ? -1 : 1)),
    })

    try {
      const payload = await toggleReviewReaction(reviewId, reactionId)
      if (payload) applyPayload(payload)
    } catch (error) {
      console.error('Failed to toggle reaction', error)
      setCounts(previousCounts)
      setMyReactions(previousMine)
    } finally {
      setIsSyncing(false)
    }
  }

  return {
    counts,
    myReactions,
    toggleReaction,
    isLoading,
    isSyncing,
    isOnline: isSupabaseConfigured(),
  }
}

export { PRIMARY_REACTIONS } from '../constants/reactions'
