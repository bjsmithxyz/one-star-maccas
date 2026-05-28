import { useEffect, useRef, useState } from 'react'
import { ReactionIcon } from './ReactionIcon'
import {
  EXTRA_EMOJI_REACTIONS,
  PRIMARY_REACTIONS,
  isEmojiReaction,
  type ReactionId,
} from '../constants/reactions'
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
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const activeExtras = EXTRA_EMOJI_REACTIONS.filter(
    ({ id }) => myReactions.includes(id) || counts[id] > 0,
  )

  useEffect(() => {
    if (!pickerOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [pickerOpen])

  const handleToggle = (id: ReactionId) => {
    void toggleReaction(id)
    if (isEmojiReaction(id)) {
      setPickerOpen(false)
    }
  }

  return (
    <div
      className={`relative mt-4 flex flex-wrap gap-2 ${isSyncing ? 'opacity-80' : ''}`}
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
          onToggle={() => handleToggle(id)}
        />
      ))}

      {activeExtras.map(({ id, label }) => (
        <ReactionButton
          key={id}
          id={id}
          label={label}
          count={counts[id]}
          isActive={myReactions.includes(id)}
          disabled={!isOnline || isLoading || isSyncing}
          onToggle={() => handleToggle(id)}
        />
      ))}

      <div ref={pickerRef} className="relative shrink-0">
        <button
          type="button"
          title="More reactions"
          aria-label="More reactions"
          aria-expanded={pickerOpen}
          disabled={!isOnline || isLoading || isSyncing}
          onClick={() => setPickerOpen((open) => !open)}
          className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border text-lg font-semibold leading-none transition ${
            pickerOpen
              ? 'border-mcd-red/40 bg-mcd-red/10 text-mcd-charcoal'
              : 'border-mcd-charcoal/10 bg-[#f2f3f5] text-mcd-charcoal/80 hover:border-mcd-charcoal/20 hover:bg-[#e3e5e8]'
          }`}
        >
          +
        </button>

        {pickerOpen && (
          <div
            role="dialog"
            aria-label="Choose a reaction"
            className="absolute bottom-full left-0 z-50 mb-2 w-[15.5rem] rounded-2xl border border-mcd-charcoal/10 bg-white p-2 shadow-lg"
          >
            <div className="grid grid-cols-6 gap-1.5">
              {EXTRA_EMOJI_REACTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={myReactions.includes(id)}
                  onClick={() => handleToggle(id)}
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-[#f2f3f5] ${
                    myReactions.includes(id)
                      ? 'bg-mcd-red/10 ring-2 ring-mcd-red/30'
                      : ''
                  }`}
                >
                  <ReactionIcon variant={id} size={22} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
