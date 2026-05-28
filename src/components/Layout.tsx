import { Link } from 'react-router-dom'
import { GITHUB_REPO_URL, SITE_NAME } from '../constants/branding'
import { RandomButton } from './RandomButton'

function GitHubIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  )
}

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
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 font-semibold text-mcd-charcoal transition hover:text-mcd-red"
        >
          <GitHubIcon />
          View source on GitHub
        </a>
      </footer>
    </div>
  )
}
