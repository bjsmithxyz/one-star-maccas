import type { ClownVariant } from '../components/ClownEmoji'

export type ReactionId = ClownVariant

export const PRIMARY_REACTIONS: { id: ReactionId; label: string }[] = [
  { id: 'laugh', label: 'Laughing clown' },
  { id: 'sad', label: 'Sad clown' },
  { id: 'confused', label: 'Confused clown' },
  { id: 'shocked', label: 'Shocked clown' },
  { id: 'dead', label: 'Dead clown' },
  { id: 'sick', label: 'Sick clown' },
]

export const ALL_REACTION_IDS: ReactionId[] = PRIMARY_REACTIONS.map(({ id }) => id)
