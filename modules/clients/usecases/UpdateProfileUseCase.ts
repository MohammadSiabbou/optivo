/**
 * Use case: update a client's basic profile (name + logo).
 *
 * Validates the payload then persists the changes.
 * Returns the updated safe client DTO.
 */
import { validateUpdateProfile, type UpdateProfilePayload } from '@/modules/clients/validation'
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'
import type { SafeClient } from '@/modules/clients/usecases/RegisterClientUseCase'

export class UpdateProfileUseCase {
  constructor(private readonly repo: IClientRepository) {}

  async execute(id: string, input: UpdateProfilePayload): Promise<SafeClient> {
    const errors = validateUpdateProfile(input)
    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ')
      throw new Error(`Validation failed: ${messages}`)
    }

    const row = await this.repo.update(id, {
      name: input.name.trim(),
      logo_url: input.logo_url ?? null,
    })

    const { password: _pw, ...safe } = row
    return safe
  }
}
