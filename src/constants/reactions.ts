import type { ClownVariant } from '../components/ClownEmoji'

export type ClownReactionId = 'laugh' | ClownVariant
export type EmojiReactionId =
  | 'thumbs-up'
  | 'thumbs-down'
  | 'heart'
  | 'fire'
  | 'skull'
  | 'cry'
  | 'pray'
  | 'clap'
  | 'eyes'
  | 'poop'
  | 'nauseated'
  | 'angry'

export type ReactionId = ClownReactionId | EmojiReactionId

export const PRIMARY_REACTIONS: { id: ClownReactionId; label: string }[] = [
  { id: 'laugh', label: 'Laughing' },
  { id: 'sad', label: 'Sad clown' },
  { id: 'confused', label: 'Confused clown' },
  { id: 'shocked', label: 'Shocked clown' },
  { id: 'dead', label: 'Dead clown' },
  { id: 'sick', label: 'Sick clown' },
]

export const EXTRA_EMOJI_REACTIONS: {
  id: EmojiReactionId
  label: string
  emoji: string
}[] = [
  { id: 'thumbs-up', label: 'Thumbs up', emoji: '👍' },
  { id: 'thumbs-down', label: 'Thumbs down', emoji: '👎' },
  { id: 'heart', label: 'Heart', emoji: '❤️' },
  { id: 'fire', label: 'Fire', emoji: '🔥' },
  { id: 'skull', label: 'Skull', emoji: '💀' },
  { id: 'cry', label: 'Crying', emoji: '😭' },
  { id: 'pray', label: 'Pray', emoji: '🙏' },
  { id: 'clap', label: 'Clap', emoji: '👏' },
  { id: 'eyes', label: 'Eyes', emoji: '👀' },
  { id: 'poop', label: 'Poop', emoji: '💩' },
  { id: 'nauseated', label: 'Nauseated', emoji: '🤮' },
  { id: 'angry', label: 'Angry', emoji: '😡' },
]

export const ALL_REACTION_IDS: ReactionId[] = [
  ...PRIMARY_REACTIONS.map(({ id }) => id),
  ...EXTRA_EMOJI_REACTIONS.map(({ id }) => id),
]

export function isEmojiReaction(id: ReactionId): id is EmojiReactionId {
  return EXTRA_EMOJI_REACTIONS.some((reaction) => reaction.id === id)
}

export function getEmojiForReaction(id: EmojiReactionId): string {
  return EXTRA_EMOJI_REACTIONS.find((reaction) => reaction.id === id)?.emoji ?? '❓'
}
