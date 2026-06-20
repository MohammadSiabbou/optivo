import {
  Compilable,
  InferResult,
  Kysely,
  PostgresDialect,
  StringReference,
} from 'kysely'
import { Pool } from 'pg'
import type { FilterMap, IDBClient } from './IDBClient'

/**
 * Concrete implementation of IDBClient backed by AWS Aurora PostgreSQL via
 * Kysely.
 *
 * Generic parameter DB must be the Kysely database schema type for the
 * project (defined in lib/db/schema.ts once tables are created).
 */
export class DBClient<DB> implements IDBClient<DB> {
  readonly kysely: Kysely<DB>

  constructor(pool: Pool) {
    this.kysely = new Kysely<DB>({
      dialect: new PostgresDialect({ pool }),
    })
  }

  // -------------------------------------------------------------------------
  // insert
  // -------------------------------------------------------------------------
  async insert<T extends keyof DB & string>(
    table: T,
    values: Omit<DB[T], 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>,
  ): Promise<DB[T]> {
    const result = await this.kysely
      .insertInto(table)
      .values(values as Parameters<typeof this.kysely.insertInto<T>>[0] extends never ? never : Record<string, unknown>)
      .returningAll()
      .executeTakeFirstOrThrow()

    return result as DB[T]
  }

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  async update<T extends keyof DB & string>(
    table: T,
    filters: FilterMap<DB[T]>,
    values: Partial<DB[T]>,
  ): Promise<DB[T][]> {
    let query = this.kysely.updateTable(table).set(values as Record<string, unknown>)

    for (const [col, val] of Object.entries(filters as Record<string, unknown>)) {
      query = query.where(col as StringReference<DB, T>, '=', val)
    }

    const rows = await query.returningAll().execute()
    return rows as DB[T][]
  }

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  async delete<T extends keyof DB & string>(
    table: T,
    filters: FilterMap<DB[T]>,
  ): Promise<DB[T][]> {
    let query = this.kysely.deleteFrom(table)

    for (const [col, val] of Object.entries(filters as Record<string, unknown>)) {
      query = query.where(col as StringReference<DB, T>, '=', val)
    }

    const rows = await query.returningAll().execute()
    return rows as DB[T][]
  }

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------
  async list<T extends keyof DB & string>(
    table: T,
    filters?: FilterMap<DB[T]>,
    options?: {
      limit?: number
      offset?: number
      orderBy?: StringReference<DB, T>
      orderDir?: 'asc' | 'desc'
    },
  ): Promise<DB[T][]> {
    let query = this.kysely.selectFrom(table).selectAll()

    if (filters) {
      for (const [col, val] of Object.entries(filters as Record<string, unknown>)) {
        query = query.where(col as StringReference<DB, T>, '=', val)
      }
    }

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDir ?? 'asc')
    }

    if (options?.limit !== undefined) {
      query = query.limit(options.limit)
    }

    if (options?.offset !== undefined) {
      query = query.offset(options.offset)
    }

    const rows = await query.execute()
    return rows as DB[T][]
  }

  // -------------------------------------------------------------------------
  // find
  // -------------------------------------------------------------------------
  async find<T extends keyof DB & string>(
    table: T,
    filters: FilterMap<DB[T]>,
  ): Promise<DB[T] | null> {
    let query = this.kysely.selectFrom(table).selectAll()

    for (const [col, val] of Object.entries(filters as Record<string, unknown>)) {
      query = query.where(col as StringReference<DB, T>, '=', val)
    }

    const row = await query.limit(1).executeTakeFirst()
    return (row as DB[T]) ?? null
  }

  // -------------------------------------------------------------------------
  // execute
  // -------------------------------------------------------------------------
  async execute<Q extends Compilable>(query: Q): Promise<InferResult<Q>> {
    return query.compile
      ? (this.kysely.executeQuery(query.compile()) as Promise<InferResult<Q>>)
      : (query as unknown as { execute: () => Promise<InferResult<Q>> }).execute()
  }
}
