/**
 * Port — every concrete client repository must implement this interface.
 * Use cases depend only on this contract, never on the implementation.
 */
import type { ClientRow } from '@/lib/db/schema'

export interface IClientRepository {
  findByEmail(email: string): Promise<ClientRow | null>
  findById(id: string): Promise<ClientRow | null>
  create(data: {
    name: string
    email: string
    password: string
    logo_url?: string | null
  }): Promise<ClientRow>
  update(
    id: string,
    data: Partial<Omit<ClientRow, 'id' | 'email' | 'created_at'>>,
  ): Promise<ClientRow>
}
