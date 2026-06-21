import { validateCreatePack, type CreatePackPayload } from '@/modules/packs/validation'
import type { IPackRepository } from '@/modules/packs/repositories/IPackRepository'
import type { PackDTO } from './types'
import { toPackDTO } from './types'

export class CreatePackUseCase {
  constructor(private readonly repo: IPackRepository) {}

  async execute(
    clientId: string,
    input: CreatePackPayload,
    locale: string = 'en',
  ): Promise<PackDTO> {
    const errors = validateCreatePack(input, locale)
    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ')
      throw new Error(`Validation failed: ${messages}`)
    }

    const row = await this.repo.create(clientId, {
      name: input.name,
      price: input.price,
      old_price: input.old_price ?? null,
      primary_image_url: input.primary_image_url,
      image_urls: input.image_urls ?? [],
      features: (input.features ?? []).map((f) => f.trim()).filter(Boolean),
      sort_order: input.sort_order ?? 0,
    })

    return toPackDTO(row)
  }
}
