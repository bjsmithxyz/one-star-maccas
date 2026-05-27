import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRandomRestaurant } from '../data'

type RandomButtonProps = {
  excludeSlug?: string
  size?: 'sm' | 'lg'
  label?: string
  className?: string
}

export function RandomButton({
  excludeSlug,
  size = 'lg',
  label = 'Random McDonald\'s',
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

  const sizeClasses =
    size === 'lg'
      ? 'px-8 py-4 text-lg sm:text-xl'
      : 'px-4 py-2 text-sm'

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
        className={`inline-flex items-center justify-center gap-2 rounded-full border-4 border-mcd-charcoal bg-mcd-red font-display uppercase tracking-wide text-white shadow-[0_6px_0_#27251f] transition hover:-translate-y-0.5 hover:shadow-[0_8px_0_#27251f] active:translate-y-1 active:shadow-[0_2px_0_#27251f] ${sizeClasses} ${spinning ? 'random-spin' : ''}`}
      >
        <span aria-hidden className="text-xl">
          🎲
        </span>
        {label}
      </button>
    </div>
  )
}
