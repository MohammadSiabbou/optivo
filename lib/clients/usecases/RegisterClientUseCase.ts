/**
 * Use case: register a new client.
 *
 * Validates the payload, checks for duplicate email, hashes the password,
 * and persists the new client row.  Returns a safe (no password) client DTO.
 */
import { validateRegister, type RegisterPayload } from '@/lib/validation/client'
import type { IClientRepository } from '../IClientRepository'
import type { ClientAuthService } from '../ClientAuthService'
import type { ClientRow } from '@/lib/db/schema'

export type SafeClient = Omit<ClientRow, 'password'>

export interface RegisterClientInput extends RegisterPayload {
  /** Optional logo URL already uploaded to Vercel Blob */
  logo_url?: string | null
}

export class RegisterClientUseCase {
  constructor(
    private readonly repo: IClientRepository,
    private readonly auth: ClientAuthService,
  ) {}

  async execute(input: RegisterClientInput): Promise<SafeClient> {
    // 1. Validate
    const errors = validateRegister(input)
    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ')
      throw new Error(`Validation failed: ${messages}`)
    }

    // 2. Check duplicate email
    const existing = await this.repo.findByEmail(input.email.trim().toLowerCase())
    if (existing) {
      throw new Error('An account with that email already exists.')
    }

    // 3. Hash password
    const hashedPassword = await this.auth.hash(input.password)

    // 4. Persist
    const row = await this.repo.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: hashedPassword,
      logo_url: input.logo_url ?? null,
    })

    // 5. Return safe DTO (strip password)
    const { password: _pw, ...safe } = row
    return safe
  }
}
