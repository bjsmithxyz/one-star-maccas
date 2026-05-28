import { ClownEmoji } from './ClownEmoji'
import type { ReactionId } from '../constants/reactions'

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
  return <ClownEmoji variant={variant} size={size} className={className} />
}

export type { ReactionId }
