import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { ROUTES } from '@/lib/routes'
import { buildServiceDeps } from '@/modules/services/factory'
import { getMessage } from '@/lib/i18n'
import { ServicesShell } from '@/components/services/ServicesShell'

export const metadata: Metadata = {
  title: 'Services — Optivo',
  description: 'Manage the photography and video services your studio offers.',
}

/**
 * Standalone /services page — Server Component.
 *
 * Auth-guard + load catalogs, then render ServicesShell (client).
 */
export default async function ServicesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) redirect(ROUTES.login)

  const payload = await verifyToken(token)
  if (!payload) redirect(ROUTES.login)

  const { getServiceCatalogUseCase } = buildServiceDeps()
  const [photoCatalog, videoCatalog] = await Promise.all([
    getServiceCatalogUseCase.execute(payload.sub, 'photo'),
    getServiceCatalogUseCase.execute(payload.sub, 'video'),
  ])

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {getMessage('en', 'nav.services')}
        </h1>
      </header>
      <ServicesShell
        photoCatalog={photoCatalog}
        videoCatalog={videoCatalog}
        locale="en"
      />
    </main>
  )
}
