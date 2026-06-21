'use client'

/**
 * PacksShell — standalone packs manager.
 *
 * Wraps PacksStep (which already handles list + form + CRUD) for use
 * on the standalone /packs dashboard page.
 */
import { getMessage } from '@/lib/i18n'
import { PacksStep } from './PacksStep'
import type { PackDTO } from '@/modules/packs/usecases/types'

interface PacksShellProps {
  initialPacks: PackDTO[]
  locale?: string
}

export function PacksShell({ initialPacks, locale = 'en' }: PacksShellProps) {
  return (
    <PacksStep
      initialPacks={initialPacks}
      locale={locale}
    />
  )
}
