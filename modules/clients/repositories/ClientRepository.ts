/**
 * Concrete implementation of IClientRepository backed by DBClient.
 */
import type { IDBClient } from '@/lib/db/IDBClient'
import type { Database, ClientRow } from '@/lib/db/schema'
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'

export class ClientRepository implements IClientRepository {
  constructor(private readonly db: IDBClient<Database>) {}

  async findByEmail(email: string): Promise<ClientRow | null> {
    return this.db.find('clients', { email })
  }

  async findById(id: string): Promise<ClientRow | null> {
    return this.db.find('clients', { id })
  }

  async create(data: {
    name: string
    email: string
    password: string
    logo_url?: string | null
  }): Promise<ClientRow> {
    return this.db.insert('clients', {
      name: data.name,
      email: data.email,
      password: data.password,
      logo_url: data.logo_url ?? null,
    })
  }
}
