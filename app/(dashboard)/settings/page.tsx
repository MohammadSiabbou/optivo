import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { ClientRepository } from '@/modules/clients/repositories/ClientRepository'
import { DBClient } from '@/lib/db/DBClient'
import { pool } from '@/lib/db/pool'
import type { Database } from '@/lib/db/schema'
import { SettingsShell } from '@/components/settings/SettingsShell'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Settings — Optivo',
  description: 'Manage your studio profile, social links, and account security.',
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) redirect(ROUTES.login)

  const payload = await verifyToken(token)
  if (!payload) redirect(ROUTES.login)

  const db = new DBClient<Database>(pool)
  const repo = new ClientRepository(db)
  const clientRow = await repo.findById(payload.sub)
  if (!clientRow) redirect(ROUTES.login)

  const { password: _pw, ...safeClient } = clientRow

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {getMessage('en', 'settings.pageTitle')}
        </h1>
      </header>
      <SettingsShell client={safeClient} />
    </main>
  )
}
