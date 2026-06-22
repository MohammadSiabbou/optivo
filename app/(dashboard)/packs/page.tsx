import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { ROUTES } from '@/lib/routes'
import { buildPackDeps } from '@/modules/packs/factory'
import { getMessage } from '@/lib/i18n'
import { PacksShell } from '@/components/packs/PacksShell'

export const metadata: Metadata = {
  title: 'Packs — Optivo',
  description: 'Manage your service packs and pricing.',
}

/**
 * Standalone /packs page — Server Component.
 *
 * Auth-guard + load packs, then render PacksShell (client).
 */
export default async function PacksPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) redirect(ROUTES.login)

  const payload = await verifyToken(token)
  if (!payload) redirect(ROUTES.login)

  const { listPacksUseCase } = buildPackDeps()
  const packs = await listPacksUseCase.execute(payload.sub)

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {getMessage('en', 'packs.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {getMessage('en', 'packs.description')}
        </p>
      </header>
      <PacksShell initialPacks={packs} locale="en" />
    </main>
  )
}
