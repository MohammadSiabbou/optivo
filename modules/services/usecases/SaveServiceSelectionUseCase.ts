/**
 * Use case: validate + persist a studio's service selections for one category.
 *
 * Steps:
 * 1. Validate the payload.
 * 2. Create any new custom definitions and capture their ids.
 * 3. Call repo.setSelections with the combined list of ids.
 * 4. Return the refreshed catalog DTO.
 */
import { validateServiceSelection, type SaveServiceSelectionPayload } from '@/modules/services/validation'
import type { IServiceRepository } from '@/modules/services/repositories/IServiceRepository'
import { GetServiceCatalogUseCase, type ServiceCatalogDTO } from './GetServiceCatalogUseCase'
import { DEFAULT_ICON } from './constants'

export class SaveServiceSelectionUseCase {
  private readonly getCatalog: GetServiceCatalogUseCase

  constructor(private readonly repo: IServiceRepository) {
    this.getCatalog = new GetServiceCatalogUseCase(repo)
  }

  async execute(
    clientId: string,
    input: SaveServiceSelectionPayload,
    locale: string = 'en',
  ): Promise<ServiceCatalogDTO> {
    const errors = validateServiceSelection(input, locale)
    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ')
      throw new Error(`Validation failed: ${messages}`)
    }

    // Create new custom definitions and collect their IDs
    const newCustomIds: string[] = []
    for (const custom of input.customServices ?? []) {
      const row = await this.repo.createCustomDefinition(clientId, {
        icon: custom.icon ?? DEFAULT_ICON,
        label: custom.label,
        category: input.category,
      })
      newCustomIds.push(row.id)
    }

    const allIds = [...(input.definitionIds ?? []), ...newCustomIds]
    await this.repo.setSelections(clientId, input.category, allIds)

    return this.getCatalog.execute(clientId, input.category)
  }
}
