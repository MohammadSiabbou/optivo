/**
 * Left-side brand panel shown on the auth pages (desktop only).
 * Contains the Optivo wordmark and a short positioning line.
 */
import Link from 'next/link'

export function AuthBrandPanel() {
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
          Every shoot,<br />
          every client,<br />
          in one place.
        </p>
        <p className="text-sm leading-relaxed text-background/50 max-w-xs">
          Manage shoots, deliver protected galleries, and build the client experience your work deserves.
        </p>
      </div>

      {/* Footer */}
      <p className="text-xs text-background/30">
        &copy; {new Date().getFullYear()} Optivo
      </p>
    </aside>
  )
}
