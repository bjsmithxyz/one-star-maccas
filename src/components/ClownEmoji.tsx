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

export function ClownEmoji({
  variant,
  size = 20,
  className = '',
}: ClownEmojiProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
    >
      <circle cx="16" cy="16" r="14" fill="#FFC72C" />
      <path
        d="M4 12c2-4 6-6 12-6s10 2 12 6"
        fill="none"
        stroke="#DA291C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M6 10c1-2 3-3 5-3M26 10c-1-2-3-3-5-3"
        fill="none"
        stroke="#DA291C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {variant === 'laugh' && (
        <>
          <path
            d="M8 14c2-2 4-2 6 0M18 14c2-2 4-2 6 0"
            fill="none"
            stroke="#27251F"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M10 24c2 3 10 3 12 0"
            fill="none"
            stroke="#27251F"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 24c0 2 1 3 2 3M20 24c0 2-1 3-2 3"
            fill="none"
            stroke="#27251F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M9 17c0 2 1 4 2 5M23 17c0 2-1 4-2 5"
            fill="none"
            stroke="#5BC0EB"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="10" cy="21" r="1.2" fill="#5BC0EB" />
          <circle cx="22" cy="21" r="1.2" fill="#5BC0EB" />
        </>
      )}

      {variant === 'sad' && (
        <>
          <path d="M9 13h4M19 13h4" stroke="#27251F" strokeWidth="2" strokeLinecap="round" />
          <circle cx="11" cy="15" r="1.5" fill="#5BC0EB" />
          <circle cx="21" cy="15" r="1.5" fill="#5BC0EB" />
          <path
            d="M10 23c2-3 10-3 12 0"
            fill="none"
            stroke="#27251F"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}

      {variant === 'confused' && (
        <>
          <circle cx="11" cy="14" r="1.8" fill="#27251F" />
          <circle cx="21" cy="14" r="1.8" fill="#27251F" />
          <path d="M14 21h6" stroke="#27251F" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M20 10l2 2-2 2"
            fill="none"
            stroke="#27251F"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {variant === 'dead' && (
        <>
          <path d="M9 13l4 4M13 13l-4 4M19 13l4 4M23 13l-4 4" stroke="#27251F" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="16" cy="22" rx="3" ry="4" fill="#27251F" />
        </>
      )}

      {variant === 'shocked' && (
        <>
          <circle cx="11" cy="14" r="2.5" fill="#27251F" />
          <circle cx="21" cy="14" r="2.5" fill="#27251F" />
          <circle cx="16" cy="22" r="3" fill="none" stroke="#27251F" strokeWidth="2" />
        </>
      )}

      {variant === 'sick' && (
        <>
          <path d="M9 13h4M19 13h4" stroke="#27251F" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M11 21c2 2 8 2 10 0"
            fill="none"
            stroke="#27251F"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="24" r="2" fill="#7CB342" />
        </>
      )}

      <circle cx="16" cy="18" r="2.8" fill="#DA291C" />
    </svg>
  )
}
