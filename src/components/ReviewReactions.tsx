import { ReactionIcon } from './ReactionIcon'
import { PRIMARY_REACTIONS, type ReactionId } from '../constants/reactions'
import { useReviewReactions } from '../hooks/useReviewReactions'

type ReviewReactionsProps = {
  reviewId: string
}

function ReactionButton({
  id,
  label,
  count,
  isActive,
  disabled,
  onToggle,
}: {
  id: ReactionId
  label: string
  count: number
  isActive: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={`${label}, ${count} reactions`}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm font-medium transition ${
        isActive
          ? 'border-mcd-red/40 bg-mcd-red/10 text-mcd-charcoal'
          : 'border-mcd-charcoal/10 bg-[#f2f3f5] text-mcd-charcoal/80 hover:border-mcd-charcoal/20 hover:bg-[#e3e5e8]'
      }`}
    >
      <ReactionIcon variant={id} size={24} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

export function ReviewReactions({ reviewId }: ReviewReactionsProps) {
  const { counts, myReactions, toggleReaction, isLoading, isSyncing, isOnline } =
    useReviewReactions(reviewId)

  return (
    <div
      className={`mt-4 flex flex-wrap gap-2 ${isSyncing ? 'opacity-80' : ''}`}
      role="group"
      aria-label="React to this review"
      aria-busy={isLoading || isSyncing}
    >
      {!isOnline && (
        <p className="w-full text-xs text-mcd-charcoal/50">
          Reactions unavailable — Supabase not configured.
        </p>
      )}

      {PRIMARY_REACTIONS.map(({ id, label }) => (
        <ReactionButton
          key={id}
          id={id}
          label={label}
          count={counts[id]}
          isActive={myReactions.includes(id)}
          disabled={!isOnline || isLoading || isSyncing}
          onToggle={() => void toggleReaction(id)}
        />
      ))}
    </div>
  )
}
