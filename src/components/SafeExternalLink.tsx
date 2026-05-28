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
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      className={className}
    >
      {children}
    </a>
  )
}
