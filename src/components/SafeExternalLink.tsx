import { sanitizeExternalUrl } from '../lib/security'

type SafeExternalLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
}

export function SafeExternalLink({
  href,
  children,
  className,
}: SafeExternalLinkProps) {
  const safeHref = sanitizeExternalUrl(href)
  if (!safeHref) return null

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      className={className}
    >
      {children}
    </a>
  )
}
