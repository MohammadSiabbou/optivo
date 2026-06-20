/**
 * Handles password hashing and verification.
 * Injected into use cases so they never touch bcrypt directly.
 */
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export class ClientAuthService {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS)
  }

  async verify(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash)
  }
}
