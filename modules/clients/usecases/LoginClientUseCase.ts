/**
 * Use case: log in an existing client.
 *
 * Validates the payload, looks up the client by email, verifies the password,
 * and returns the safe client DTO.  The JWT is signed in the API route layer
 * so this use case stays transport-agnostic.
 */
import { validateLogin, type LoginPayload } from '@/modules/clients/validation'
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'
import type { ClientAuthService } from '@/modules/clients/services/ClientAuthService'
import type { SafeClient } from '@/modules/clients/usecases/RegisterClientUseCase'
import type { ClientRow } from '@/lib/db/schema'

export class LoginClientUseCase {
  constructor(
    private readonly repo: IClientRepository,
    private readonly auth: ClientAuthService,
  ) {}

  async execute(input: LoginPayload): Promise<SafeClient> {
    // 1. Validate
    const errors = validateLogin(input)
    if (Object.keys(errors).length > 0) {
      throw new Error('Invalid email or password.')
    }

    // 2. Fetch client
    const client: ClientRow | null = await this.repo.findByEmail(
      input.email.trim().toLowerCase(),
    )
    if (!client) {
      throw new Error('Invalid email or password.')
    }

    // 3. Verify password
    const ok = await this.auth.verify(input.password, client.password)
    if (!ok) {
      throw new Error('Invalid email or password.')
    }

    // 4. Return safe DTO
    const { password: _pw, ...safe } = client
    return safe
  }
}
