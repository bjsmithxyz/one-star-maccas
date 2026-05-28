import { ClownEmoji, type ClownVariant } from './ClownEmoji'
import {
  getEmojiForReaction,
  isEmojiReaction,
  type EmojiReactionId,
  type ReactionId,
} from '../constants/reactions'

type ReactionIconProps = {
  variant: ReactionId
  size?: number
  className?: string
}

export function ReactionIcon({
  variant,
  size = 24,
  className = '',
}: ReactionIconProps) {
  if (variant === 'laugh') {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center leading-none ${className}`}
        style={{ fontSize: size * 0.78 }}
        aria-hidden
      >
        😂
      </span>
    )
  }

  if (isEmojiReaction(variant)) {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center leading-none ${className}`}
        style={{ fontSize: size * 0.78 }}
        aria-hidden
      >
        {getEmojiForReaction(variant as EmojiReactionId)}
      </span>
    )
  }

  return <ClownEmoji variant={variant as ClownVariant} size={size} className={className} />
}

export type { ReactionId }
