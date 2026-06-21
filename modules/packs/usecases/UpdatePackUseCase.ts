import { validateUpdatePack, type UpdatePackPayload } from '@/modules/packs/validation'
import type { IPackRepository } from '@/modules/packs/repositories/IPackRepository'
import type { PackDTO } from './types'
import { toPackDTO } from './types'

export class UpdatePackUseCase {
  constructor(private readonly repo: IPackRepository) {}

  async execute(
    clientId: string,
    id: string,
    input: UpdatePackPayload,
    locale: string = 'en',
  ): Promise<PackDTO> {
    const errors = validateUpdatePack(input, locale)
    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ')
      throw new Error(`Validation failed: ${messages}`)
    }

    const data: Record<string, unknown> = {}
    if (input.name !== undefined) data.name = input.name
    if (input.price !== undefined) data.price = input.price
    if ('old_price' in input) data.old_price = input.old_price ?? null
    if ('primary_image_url' in input) data.primary_image_url = input.primary_image_url ?? null
    if (input.image_urls !== undefined) data.image_urls = input.image_urls
    if (input.features !== undefined) {
      data.features = input.features.map((f) => f.trim()).filter(Boolean)
    }
    if (input.sort_order !== undefined) data.sort_order = input.sort_order

    const row = await this.repo.update(clientId, id, data as Parameters<IPackRepository['update']>[2])
    return toPackDTO(row)
  }
}
