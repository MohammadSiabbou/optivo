import type { IPackRepository } from '@/modules/packs/repositories/IPackRepository'
import type { PackDTO } from './types'
import { toPackDTO } from './types'

export class ListPacksUseCase {
  constructor(private readonly repo: IPackRepository) {}

  async execute(clientId: string): Promise<PackDTO[]> {
    const rows = await this.repo.listForClient(clientId)
    return rows.map(toPackDTO)
  }
}
