import { useId } from 'react'

export type ClownVariant =
  | 'laugh'
  | 'sad'
  | 'confused'
  | 'shocked'
  | 'dead'
  | 'sick'

type ClownEmojiProps = {
  variant: ClownVariant
  size?: number
  className?: string
}

const CHARCOAL = '#27251F'
const TEAR = '#5BC0EB'
const SICK = '#7CB342'

function FaceFeatures({
  variant,
  charcoal,
  tear,
  sick,
}: {
  variant: ClownVariant
  charcoal: string
  tear: string
  sick: string
}) {
  switch (variant) {
    case 'laugh':
      return (
        <>
          <path
            d="M8.5 14.5c2.2-2.2 4.8-2.2 7 0M16.5 14.5c2.2-2.2 4.8-2.2 7 0"
            fill="none"
            stroke={charcoal}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M9.5 22.5c2.5 3.5 10.5 3.5 13 0"
            fill={charcoal}
            opacity="0.12"
          />
          <path
            d="M9.5 22.5c2.5 3.5 10.5 3.5 13 0"
            fill="none"
            stroke={charcoal}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M11 22.8c1.2 1.8 2.4 2.2 3.2 2.2M21 22.8c-1.2 1.8-2.4 2.2-3.2 2.2"
            fill="none"
            stroke={charcoal}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M9 17.5c0.5 2.2 1.5 3.8 2.2 4.5M23 17.5c-0.5 2.2-1.5 3.8-2.2 4.5"
            fill="none"
            stroke={tear}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse cx="10" cy="21.5" rx="1.4" ry="2" fill={tear} />
          <ellipse cx="22" cy="21.5" rx="1.4" ry="2" fill={tear} />
          <circle cx="10.5" cy="19.8" r="0.7" fill="white" opacity="0.55" />
          <circle cx="21.5" cy="19.8" r="0.7" fill="white" opacity="0.55" />
        </>
      )

    case 'sad':
      return (
        <>
          <path
            d="M8.5 12.5c1.5-1 3.5-1 5 0M18.5 12.5c1.5-1 3.5-1 5 0"
            fill="none"
            stroke={charcoal}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path d="M9.5 14.5h4M18.5 14.5h4" stroke={charcoal} strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="11.5" cy="17.2" rx="1.5" ry="2.2" fill={tear} />
          <ellipse cx="20.5" cy="17.2" rx="1.5" ry="2.2" fill={tear} />
          <circle cx="11.5" cy="15.8" r="0.6" fill="white" opacity="0.5" />
          <circle cx="20.5" cy="15.8" r="0.6" fill="white" opacity="0.5" />
          <path
            d="M10 24c2.5-3 9-3 12 0"
            fill="none"
            stroke={charcoal}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      )

    case 'confused':
      return (
        <>
          <circle cx="11" cy="14.5" r="2" fill={charcoal} />
          <circle cx="10.4" cy="13.8" r="0.65" fill="white" opacity="0.85" />
          <circle cx="21" cy="14.5" r="2.6" fill={charcoal} />
          <circle cx="20.1" cy="13.5" r="0.8" fill="white" opacity="0.85" />
          <path
            d="M17.5 10.5c1.2-1.8 3.5-2.2 5-1"
            fill="none"
            stroke={charcoal}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M13.5 22h5.5" stroke={charcoal} strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M22 9.5l2.2 2.2-2.2 2"
            fill="none"
            stroke={charcoal}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )

    case 'dead':
      return (
        <>
          <path
            d="M8.5 12.5l5.5 5.5M14 12.5l-5.5 5.5M18 12.5l5.5 5.5M23.5 12.5l-5.5 5.5"
            stroke={charcoal}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <ellipse cx="16" cy="23" rx="3.2" ry="3.8" fill={charcoal} />
          <ellipse cx="16" cy="22.2" rx="2.2" ry="2.6" fill="#8B4513" opacity="0.55" />
        </>
      )

    case 'shocked':
      return (
        <>
          <circle cx="11" cy="14.5" r="3.2" fill="white" stroke={charcoal} strokeWidth="1.6" />
          <circle cx="21" cy="14.5" r="3.2" fill="white" stroke={charcoal} strokeWidth="1.6" />
          <circle cx="11" cy="14.8" r="1.35" fill={charcoal} />
          <circle cx="21" cy="14.8" r="1.35" fill={charcoal} />
          <circle cx="11.4" cy="14.2" r="0.45" fill="white" />
          <circle cx="21.4" cy="14.2" r="0.45" fill="white" />
          <circle cx="16" cy="23" r="2.8" fill="none" stroke={charcoal} strokeWidth="2.2" />
        </>
      )

    case 'sick':
      return (
        <>
          <path d="M9 14h4M19 14h4" stroke={charcoal} strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M11 21.5c1.5 1.5 3 2 5 2s3.5-0.5 5-2"
            fill="none"
            stroke={charcoal}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M13 21.8c0.8 0.8 1.8 1.2 3 1.2s2.2-0.4 3-1.2"
            fill="none"
            stroke={charcoal}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx="24.5" cy="24.5" r="2.4" fill={sick} />
          <circle cx="23.8" cy="23.8" r="0.7" fill="white" opacity="0.45" />
          <path
            d="M23 26.2c0.8 0.5 1.8 0.4 2.5-0.2"
            fill="none"
            stroke="#558B2F"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </>
      )
  }
}

export function ClownEmoji({
  variant,
  size = 20,
  className = '',
}: ClownEmojiProps) {
  const uid = useId().replace(/:/g, '')
  const faceGrad = `clown-face-${uid}`
  const hairGrad = `clown-hair-${uid}`
  const noseGrad = `clown-nose-${uid}`
  const shadow = `clown-shadow-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
    >
      <defs>
        <radialGradient id={faceGrad} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="55%" stopColor="#FFC72C" />
          <stop offset="100%" stopColor="#E6A800" />
        </radialGradient>
        <linearGradient id={hairGrad} x1="16" y1="2" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F03A2F" />
          <stop offset="100%" stopColor="#B71C1C" />
        </linearGradient>
        <radialGradient id={noseGrad} cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#FF5A4D" />
          <stop offset="100%" stopColor="#C41E16" />
        </radialGradient>
        <filter id={shadow} x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="0.8" stdDeviation="0.7" floodColor="#27251F" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter={`url(#${shadow})`}>
        <circle cx="16" cy="17" r="13.5" fill={`url(#${faceGrad})`} stroke={CHARCOAL} strokeWidth="0.8" strokeOpacity="0.12" />

        <ellipse cx="10.5" cy="16.5" rx="3.8" ry="4.2" fill="white" opacity="0.28" />
        <ellipse cx="21.5" cy="16.5" rx="3.8" ry="4.2" fill="white" opacity="0.28" />

        <path
          d="M16 3.5c-7.5 0-12.5 4.5-12.5 10.5 0-3.5 1.5-6 4-7.5C9.5 4.5 12.5 3.5 16 3.5c3.5 0 6.5 1 8.5 2.5 2.5 1.5 4 4 4 7.5 0-6-5-10.5-12.5-10.5z"
          fill={`url(#${hairGrad})`}
        />
        <path
          d="M5 12.5c-0.5 2.5 0.5 4.5 2 5.5M27 12.5c0.5 2.5-0.5 4.5-2 5.5"
          fill="none"
          stroke="#8B0000"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M4.5 11.5c1.5-2.5 4-3.5 6.5-3M27.5 11.5c-1.5-2.5-4-3.5-6.5-3"
          fill="none"
          stroke="#FF6B61"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.45"
        />

        <FaceFeatures variant={variant} charcoal={CHARCOAL} tear={TEAR} sick={SICK} />

        <circle cx="16" cy="18.5" r="3.1" fill={`url(#${noseGrad})`} stroke="#A01810" strokeWidth="0.6" />
        <ellipse cx="15.1" cy="17.6" rx="1.1" ry="0.75" fill="white" opacity="0.55" />
      </g>
    </svg>
  )
}
