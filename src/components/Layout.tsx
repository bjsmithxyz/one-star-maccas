import { Link } from 'react-router-dom'
import { SITE_NAME } from '../constants/branding'
import { RandomButton } from './RandomButton'

type LayoutProps = {
  children: React.ReactNode
  excludeSlug?: string
}

export function Layout({ children, excludeSlug }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b-4 border-mcd-red bg-mcd-gold/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="group flex items-center gap-2 text-mcd-charcoal transition hover:opacity-80"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mcd-red text-xl text-white shadow-md">
              ★
            </span>
            <div>
              <p className="font-display text-lg leading-none sm:text-xl">
                {SITE_NAME}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/map"
              className="rounded-full border-2 border-mcd-charcoal/15 px-3 py-2 text-sm font-semibold text-mcd-charcoal transition hover:border-mcd-red hover:text-mcd-red sm:px-4"
            >
              Map
            </Link>
            <RandomButton
              excludeSlug={excludeSlug}
              size="sm"
              label="Random"
            />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-mcd-charcoal/10 bg-white/60 px-4 py-8 text-center text-sm text-mcd-charcoal/70 sm:px-6">
        <p className="mx-auto max-w-2xl leading-relaxed">
          Fan parody site — not affiliated with McDonald&apos;s Corporation.
          Reviews are publicly posted user content, curated for entertainment.
        </p>
      </footer>
    </div>
  )
}
