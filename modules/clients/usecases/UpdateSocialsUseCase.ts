/**
 * Use case: update a client's social media links.
 *
 * Validates each URL (optional; empty string is treated as clearing the field),
 * maps empty strings to null before persisting, and returns the updated
 * safe client DTO.
 */
import { validateUpdateSocials, type UpdateSocialsPayload } from '@/modules/clients/validation'
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'
import type { SafeClient } from '@/modules/clients/usecases/RegisterClientUseCase'

function normalise(val: string | undefined): string | null {
  return val && val.trim() !== '' ? val.trim() : null
}

export class UpdateSocialsUseCase {
  constructor(private readonly repo: IClientRepository) {}

  async execute(id: string, input: UpdateSocialsPayload): Promise<SafeClient> {
    const errors = validateUpdateSocials(input)
    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ')
      throw new Error(`Validation failed: ${messages}`)
    }

    const row = await this.repo.update(id, {
      instagram_url: normalise(input.instagram_url),
      facebook_url: normalise(input.facebook_url),
      linkedin_url: normalise(input.linkedin_url),
      twitter_url: normalise(input.twitter_url),
    })

    const { password: _pw, ...safe } = row
    return safe
  }
}
