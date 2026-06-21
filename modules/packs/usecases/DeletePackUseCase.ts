import type { IPackRepository } from '@/modules/packs/repositories/IPackRepository'

export class DeletePackUseCase {
  constructor(private readonly repo: IPackRepository) {}

  async execute(clientId: string, id: string): Promise<void> {
    await this.repo.delete(clientId, id)
  }
}
