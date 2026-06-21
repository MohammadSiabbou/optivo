/**
 * Use case: change a client's password.
 *
 * Validates the payload, verifies the current password, hashes the new one,
 * and persists the update.  Returns void — no sensitive data is exposed.
 */
import { validateChangePassword, type ChangePasswordPayload } from '@/modules/clients/validation'
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'
import type { ClientAuthService } from '@/modules/clients/services/ClientAuthService'
import { getMessage } from '@/lib/i18n'

export class ChangePasswordUseCase {
  constructor(
    private readonly repo: IClientRepository,
    private readonly auth: ClientAuthService,
  ) {}

  async execute(id: string, input: ChangePasswordPayload, locale: string = 'en'): Promise<void> {
    // 1. Validate shape
    const errors = validateChangePassword(input, locale)
    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ')
      throw new Error(`Validation failed: ${messages}`)
    }

    // 2. Fetch current row to get stored hash
    const client = await this.repo.findById(id)
    if (!client) throw new Error('Client not found.')

    // 3. Verify current password
    const ok = await this.auth.verify(input.currentPassword, client.password)
    if (!ok) {
      throw new Error(getMessage(locale, 'settings.profile.security.wrongCurrentPassword'))
    }

    // 4. Hash + persist
    const hashed = await this.auth.hash(input.newPassword)
    await this.repo.update(id, { password: hashed })
  }
}
