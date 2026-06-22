import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { ClientRepository } from '@/modules/clients/repositories/ClientRepository'
import { DBClient } from '@/lib/db/DBClient'
import { pool } from '@/lib/db/pool'
import type { Database } from '@/lib/db/schema'
import { ROUTES } from '@/lib/routes'
import { buildServiceDeps } from '@/modules/services/factory'
import { buildPackDeps } from '@/modules/packs/factory'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

/**
 * Onboarding page — Server Component.
 *
 * Auth-guards the page and redirects already-onboarded studios to /dashboard.
 * Fetches initial data (service catalogs + packs) server-side and passes DTOs
 * down to the client OnboardingWizard component.
 */
export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) redirect(ROUTES.login)

  const payload = await verifyToken(token)
  if (!payload) redirect(ROUTES.login)

  // If onboarding is already complete, redirect to dashboard
  const db = new DBClient<Database>(pool)
  const clientRepo = new ClientRepository(db)
  const clientRow = await clientRepo.findById(payload.sub)
  if (!clientRow) redirect(ROUTES.login)
  if (clientRow.onboarding_completed_at !== null) redirect(ROUTES.dashboard)

  // Load service catalogs
  const { getServiceCatalogUseCase } = buildServiceDeps()
  const [photoCatalog, videoCatalog] = await Promise.all([
    getServiceCatalogUseCase.execute(payload.sub, 'photo'),
    getServiceCatalogUseCase.execute(payload.sub, 'video'),
  ])

  // Load existing packs (could be empty on first visit)
  const { listPacksUseCase } = buildPackDeps()
  const packs = await listPacksUseCase.execute(payload.sub)

  return (
    <main>
      <OnboardingWizard
        photoCatalog={photoCatalog}
        videoCatalog={videoCatalog}
        initialPacks={packs}
        locale="en"
      />
    </main>
  )
}
