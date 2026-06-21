/**
 * Use case: add a single custom service definition for a studio.
 *
 * Used by the "add your own" inline action when not done as part of a bulk
 * SaveServiceSelection call.
 */
import { validateCustomServiceLabel, validateCategory } from '@/modules/services/validation'
import type { IServiceRepository } from '@/modules/services/repositories/IServiceRepository'
import type { ServiceDefinitionDTO } from './types'
import { toServiceDTO } from './types'
import { DEFAULT_ICON } from './constants'
import { getMessage } from '@/lib/i18n'

export class AddCustomServiceUseCase {
  constructor(private readonly repo: IServiceRepository) {}

  async execute(
    clientId: string,
    input: { label: string; icon?: string; category: string },
    locale: string = 'en',
  ): Promise<ServiceDefinitionDTO> {
    const labelErr = validateCustomServiceLabel(input.label, locale)
    if (labelErr) throw new Error(`Validation failed: ${labelErr}`)

    const categoryErr = validateCategory(input.category, locale)
    if (categoryErr) throw new Error(`Validation failed: ${categoryErr}`)

    const row = await this.repo.createCustomDefinition(clientId, {
      icon: input.icon ?? DEFAULT_ICON,
      label: input.label,
      category: input.category,
    })

    return toServiceDTO(row)
  }
}
