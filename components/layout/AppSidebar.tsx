import { cookies } from 'next/headers'
import { TOKEN_COOKIE, verifyToken } from '@/lib/auth/jwt'
import { getMessage } from '@/lib/i18n'
import { SidebarContent } from './SidebarContent'

/**
 * AppSidebar — Server Component.
 *
 * Reads the JWT from the httpOnly cookie to extract the user name and logo
 * URL, then delegates rendering to the <SidebarContent> client component.
 */
export async function AppSidebar() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value ?? null

  const payload = token ? await verifyToken(token) : null
  const name = payload?.name ?? ''
  const logoUrl = (payload as (typeof payload & { logoUrl?: string }))?.logoUrl ?? null

  const locale = 'en'

  return (
    <aside
      aria-label={getMessage(locale, 'nav.sidebarLabel')}
      className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
    >
      <SidebarContent name={name} logoUrl={logoUrl} />
    </aside>
  )
}
