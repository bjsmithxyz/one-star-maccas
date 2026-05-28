import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRandomRestaurant } from '../data'

type RandomButtonProps = {
  excludeSlug?: string
  size?: 'sm' | 'lg'
  label?: string
  iconOnly?: boolean
  className?: string
}

export function RandomButton({
  excludeSlug,
  size = 'lg',
  label = 'Random McDonald\'s',
  iconOnly = false,
  className = '',
}: RandomButtonProps) {
  const navigate = useNavigate()
  const [spinning, setSpinning] = useState(false)
  const [flashing, setFlashing] = useState(false)

  const handleClick = () => {
    setSpinning(true)
    setFlashing(true)

    window.setTimeout(() => {
      const restaurant = getRandomRestaurant(excludeSlug)
      navigate(`/r/${restaurant.slug}`)
      setSpinning(false)
      setFlashing(false)
    }, 220)
  }

  const sizeClasses = iconOnly
    ? 'p-3.5'
    : size === 'lg'
      ? 'px-8 py-4 text-lg sm:text-xl'
      : 'px-4 py-2 text-sm'

  const diceClasses = iconOnly
    ? 'text-3xl leading-none'
    : 'text-xl'

  const accessibleLabel = iconOnly ? 'Another random McDonald\'s' : label

  return (
    <div className={`relative inline-flex ${className}`}>
      {flashing && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-white globe-flash"
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-label={accessibleLabel}
        className={`inline-flex items-center justify-center gap-2 rounded-full border-4 border-mcd-charcoal bg-mcd-red font-display uppercase tracking-wide text-white shadow-[0_6px_0_#27251f] transition hover:-translate-y-0.5 hover:shadow-[0_8px_0_#27251f] active:translate-y-1 active:shadow-[0_2px_0_#27251f] ${sizeClasses} ${spinning ? 'random-spin' : ''}`}
      >
        <span aria-hidden className={diceClasses}>
          🎲
        </span>
        {!iconOnly && label}
      </button>
    </div>
  )
}
