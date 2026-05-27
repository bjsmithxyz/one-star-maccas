import { ClownEmoji } from './ClownEmoji'
import { CLOWN_REACTIONS, useReviewReactions } from '../hooks/useReviewReactions'

type ReviewReactionsProps = {
  reviewId: string
}

export function ReviewReactions({ reviewId }: ReviewReactionsProps) {
  const { counts, myReactions, toggleReaction } = useReviewReactions(reviewId)

  return (
    <div
      className="mt-4 flex flex-wrap gap-2"
      role="group"
      aria-label="React to this review"
    >
      {CLOWN_REACTIONS.map(({ id, label }) => {
        const isActive = myReactions.includes(id)

        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={`${label}, ${counts[id]} reactions`}
            aria-pressed={isActive}
            onClick={() => toggleReaction(id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm font-medium transition ${
              isActive
                ? 'border-mcd-red/40 bg-mcd-red/10 text-mcd-charcoal'
                : 'border-mcd-charcoal/10 bg-[#f2f3f5] text-mcd-charcoal/80 hover:border-mcd-charcoal/20 hover:bg-[#e3e5e8]'
            }`}
          >
            <ClownEmoji variant={id} size={24} />
            {counts[id] > 0 && <span>{counts[id]}</span>}
          </button>
        )
      })}
    </div>
  )
}
