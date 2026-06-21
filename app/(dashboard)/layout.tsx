import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { ClientRepository } from '@/modules/clients/repositories/ClientRepository'
import { DBClient } from '@/lib/db/DBClient'
import { pool } from '@/lib/db/pool'
import type { Database } from '@/lib/db/schema'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Dashboard — Optivo',
  description: 'Manage your shoots, galleries, and clients.',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) redirect(ROUTES.login)

  const payload = await verifyToken(token)
  if (!payload) redirect(ROUTES.login)

  // Onboarding gate: fetch the client row to check completion status
  const db = new DBClient<Database>(pool)
  const repo = new ClientRepository(db)
  const clientRow = await repo.findById(payload.sub)
  if (!clientRow) redirect(ROUTES.login)

  // Redirect to wizard if onboarding is not complete
  if (clientRow.onboarding_completed_at === null) {
    redirect(ROUTES.onboarding)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
