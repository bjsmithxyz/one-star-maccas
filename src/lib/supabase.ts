import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!)
  }
  return client
}

const VOTER_ID_KEY = '1-star-maccas-voter-id'

export function getVoterId(): string {
  try {
    const existing = localStorage.getItem(VOTER_ID_KEY)
    if (existing) return existing

    const created = crypto.randomUUID()
    localStorage.setItem(VOTER_ID_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

export type ReactionPayload = {
  counts: Record<string, number>
  mine: string[]
}

export async function fetchReviewReactions(
  reviewId: string,
): Promise<ReactionPayload | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const voterId = getVoterId()
  const { data, error } = await supabase.rpc('get_review_reactions', {
    p_review_id: reviewId,
    p_voter_id: voterId,
  })

  if (error) throw error
  return normalizeReactionPayload(data)
}

export async function toggleReviewReaction(
  reviewId: string,
  reactionId: string,
): Promise<ReactionPayload | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const voterId = getVoterId()
  const { data, error } = await supabase.rpc('toggle_review_reaction', {
    p_review_id: reviewId,
    p_reaction_id: reactionId,
    p_voter_id: voterId,
  })

  if (error) throw error
  return normalizeReactionPayload(data)
}

function normalizeReactionPayload(data: unknown): ReactionPayload {
  const payload = (data ?? {}) as Partial<ReactionPayload>
  return {
    counts:
      payload.counts && typeof payload.counts === 'object' ? payload.counts : {},
    mine: Array.isArray(payload.mine) ? payload.mine : [],
  }
}
