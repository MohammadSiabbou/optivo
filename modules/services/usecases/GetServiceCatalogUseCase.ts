/**
 * Use case: hydrate the service catalog for a given client + optional category.
 *
 * Returns defaults, the studio's custom definitions, and the set of selected IDs
 * so the UI can pre-populate toggles.
 */
import type { IServiceRepository } from '@/modules/services/repositories/IServiceRepository'
import type { ServiceDefinitionDTO } from './types'
import { toServiceDTO } from './types'

export interface ServiceCatalogDTO {
  defaults: ServiceDefinitionDTO[]
  custom: ServiceDefinitionDTO[]
  selectedIds: string[]
}

export class GetServiceCatalogUseCase {
  constructor(private readonly repo: IServiceRepository) {}

  async execute(clientId: string, category?: string): Promise<ServiceCatalogDTO> {
    const [defaults, custom, selected] = await Promise.all([
      this.repo.listDefaults(category),
      this.repo.listCustomForClient(clientId, category),
      this.repo.listSelectedForClient(clientId, category),
    ])

    return {
      defaults: defaults.map(toServiceDTO),
      custom: custom.map(toServiceDTO),
      selectedIds: selected.map((r) => r.id),
    }
  }
}
