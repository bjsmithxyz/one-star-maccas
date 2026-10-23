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
  label = 'Surprise me',
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
    ? 'p-3'
    : size === 'lg'
      ? 'px-6 py-3.5 text-base sm:text-lg'
      : 'px-3.5 py-2 text-sm'

  const diceClasses = iconOnly
    ? 'text-2xl leading-none'
    : 'text-base'

  const accessibleLabel = iconOnly ? 'Another review' : label

  return (
    <div className={`relative inline-flex ${className}`}>
      {flashing && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl bg-white globe-flash"
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-label={accessibleLabel}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-mcd-red font-bold tracking-wide text-white shadow-lg shadow-mcd-red/20 transition hover:-translate-y-0.5 hover:bg-mcd-red/90 hover:shadow-xl hover:shadow-mcd-red/25 active:translate-y-0 ${sizeClasses} ${spinning ? 'random-spin' : ''}`}
      >
        <span aria-hidden className={diceClasses}>
          ✦
        </span>
        {!iconOnly && label}
      </button>
    </div>
  )
}
