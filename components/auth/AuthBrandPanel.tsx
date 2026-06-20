/**
 * Left-side brand panel shown on the auth pages (desktop only).
 * Contains the Optivo wordmark and a short positioning line.
 */
import Link from 'next/link'
import { getMessage } from '@/lib/i18n'

export function AuthBrandPanel() {
  const locale = 'en'
  const tagline = getMessage(locale, 'auth.brand.tagline')
  const subtitle = getMessage(locale, 'auth.brand.subtitle')
  const copyright = getMessage(locale, 'auth.brand.copyright', { year: new Date().getFullYear() })

  return (
    <aside
      aria-hidden="true"
      className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-foreground text-background px-14 py-12 select-none"
    >
      {/* Wordmark */}
      <Link href="/" className="text-xl font-semibold tracking-tight text-background/90 hover:text-background transition-colors">
        Optivo
      </Link>

      {/* Centre copy */}
      <div className="space-y-4">
        <p className="text-4xl font-semibold leading-tight tracking-tight text-balance">
          {tagline.split(',').map((line, i) => (
            <span key={i}>
              {line.trim()}
              {i < tagline.split(',').length - 1 && <br />}
            </span>
          ))}
        </p>
        <p className="text-sm leading-relaxed text-background/50 max-w-xs">
          {subtitle}
        </p>
      </div>

      {/* Footer */}
      <p className="text-xs text-background/30">
        {copyright}
      </p>
    </aside>
  )
}
