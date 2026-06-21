/**
 * Use case: remove a studio's custom service definition.
 *
 * Ownership is enforced in the repository (client_id filter); defaults
 * (client_id IS NULL) cannot be deleted by this path.
 */
import type { IServiceRepository } from '@/modules/services/repositories/IServiceRepository'

export class DeleteCustomServiceUseCase {
  constructor(private readonly repo: IServiceRepository) {}

  async execute(clientId: string, definitionId: string): Promise<void> {
    await this.repo.deleteCustomDefinition(clientId, definitionId)
  }
}
