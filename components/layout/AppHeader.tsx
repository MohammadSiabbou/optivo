import { cookies } from 'next/headers'
import { TOKEN_COOKIE, verifyToken } from '@/lib/auth/jwt'
import { UserMenu } from './UserMenu'

/**
 * Top navigation bar — Server Component.
 *
 * Reads the JWT from the httpOnly cookie to extract the user's name and
 * logo URL, then renders the <UserMenu> client widget on the right.
 *
 * If the token is missing or invalid the header still renders; middleware
 * handles the redirect before this component is ever reached on protected
 * routes.
 */
export async function AppHeader() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value ?? null

  const payload = token ? await verifyToken(token) : null
  const name = payload?.name ?? ''
  const logoUrl = (payload as (typeof payload & { logoUrl?: string }))?.logoUrl ?? null

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark / brand */}
        <span className="text-sm font-semibold tracking-tight text-foreground select-none">
          Optivo
        </span>

        {/* User menu — only rendered when authenticated */}
        {payload && <UserMenu name={name} logoUrl={logoUrl} />}
      </div>
    </header>
  )
}
