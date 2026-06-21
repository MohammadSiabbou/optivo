/**
 * Concrete implementation of IPackRepository backed by DBClient.
 *
 * All queries are scoped by client_id. JSONB columns (image_urls, features)
 * are passed as JS arrays; pg handles JSON serialisation. price / old_price
 * are returned as strings by pg (NUMERIC) — conversion happens at the
 * use-case / DTO boundary.
 */
import type { IDBClient } from '@/lib/db/IDBClient'
import type { Database, PackRow } from '@/lib/db/schema'
import type { IPackRepository } from './IPackRepository'

export class PackRepository implements IPackRepository {
  constructor(private readonly db: IDBClient<Database>) {}

  async listForClient(clientId: string): Promise<PackRow[]> {
    const rows = await this.db.kysely
      .selectFrom('packs')
      .selectAll()
      .where('client_id', '=', clientId)
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc')
      .execute()
    return rows as PackRow[]
  }

  async findById(id: string): Promise<PackRow | null> {
    const row = await this.db.kysely
      .selectFrom('packs')
      .selectAll()
      .where('id', '=', id)
      .limit(1)
      .executeTakeFirst()
    return (row as PackRow) ?? null
  }

  async create(
    clientId: string,
    data: {
      name: string
      price: number
      old_price?: number | null
      primary_image_url: string
      image_urls: string[]
      features: string[]
      sort_order?: number
    },
  ): Promise<PackRow> {
    const row = await this.db.kysely
      .insertInto('packs')
      .values({
        client_id: clientId,
        name: data.name.trim(),
        price: data.price as unknown as string,
        old_price: (data.old_price ?? null) as unknown as string | null,
        primary_image_url: data.primary_image_url,
        image_urls: JSON.stringify(data.image_urls) as unknown as string[],
        features: JSON.stringify(data.features) as unknown as string[],
        sort_order: data.sort_order ?? 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    return row as PackRow
  }

  async update(
    clientId: string,
    id: string,
    data: {
      name?: string
      price?: number
      old_price?: number | null
      primary_image_url?: string | null
      image_urls?: string[]
      features?: string[]
      sort_order?: number
    },
  ): Promise<PackRow> {
    const values: Record<string, unknown> = { updated_at: new Date() }
    if (data.name !== undefined) values.name = data.name.trim()
    if (data.price !== undefined) values.price = data.price
    if ('old_price' in data) values.old_price = data.old_price ?? null
    if ('primary_image_url' in data) values.primary_image_url = data.primary_image_url ?? null
    if (data.image_urls !== undefined) values.image_urls = JSON.stringify(data.image_urls)
    if (data.features !== undefined) values.features = JSON.stringify(data.features)
    if (data.sort_order !== undefined) values.sort_order = data.sort_order

    const row = await this.db.kysely
      .updateTable('packs')
      .set(values)
      .where('id', '=', id)
      .where('client_id', '=', clientId) // ownership check
      .returningAll()
      .executeTakeFirstOrThrow()
    return row as PackRow
  }

  async delete(clientId: string, id: string): Promise<void> {
    await this.db.kysely
      .deleteFrom('packs')
      .where('id', '=', id)
      .where('client_id', '=', clientId) // ownership check
      .execute()
  }

  async reorder(clientId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db.kysely
        .updateTable('packs')
        .set({ sort_order: i })
        .where('id', '=', orderedIds[i])
        .where('client_id', '=', clientId)
        .execute()
    }
  }
}
