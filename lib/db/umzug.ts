/**
 * Umzug migration configuration for Aurora PostgreSQL with raw pg driver.
 *
 * Migrations are registered with static imports so Next.js can analyse them
 * at build time. Add every new migration file to the MIGRATIONS array below.
 */
import { Umzug, UmzugStorage } from 'umzug'
import { pool } from './pool'
import * as migration001 from './migrations/001_create_clients_table.js'

// ---------------------------------------------------------------------------
// Registry — add each new migration here in order
// ---------------------------------------------------------------------------
const MIGRATIONS: Array<{
  name: string
  up: (ctx: { context: any }) => Promise<void>
  down: (ctx: { context: any }) => Promise<void>
}> = [
  { name: '001_create_clients_table', ...migration001 },
]

/**
 * Custom storage for tracking migrations in the database.
 */
class PgStorage implements UmzugStorage {
  private tableName = 'umzug_migrations'

  async logMigration({ name }: { name: string }) {
    const client = await pool.connect()
    try {
      await client.query(`
        INSERT INTO ${this.tableName} (name)
        VALUES ($1)
        ON CONFLICT DO NOTHING
      `, [name])
    } finally {
      client.release()
    }
  }

  async unlogMigration({ name }: { name: string }) {
    const client = await pool.connect()
    try {
      await client.query(`
        DELETE FROM ${this.tableName} WHERE name = $1
      `, [name])
    } finally {
      client.release()
    }
  }

  async executed(): Promise<{ name: string }[]> {
    const client = await pool.connect()
    try {
      // Ensure table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          name TEXT PRIMARY KEY,
          executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)

      const result = await client.query(`
        SELECT name FROM ${this.tableName} ORDER BY executed_at ASC
      `)
      return result.rows.map((row: any) => ({ name: row.name }))
    } finally {
      client.release()
    }
  }
}

export const umzug = new Umzug({
  migrations: MIGRATIONS.map((m) => ({
    name: m.name,
    up: async () => {
      const client = await pool.connect()
      try {
        await m.up({ context: client })
        console.log(`[migrate] ✓ Executed: ${m.name}`)
      } finally {
        client.release()
      }
    },
    down: async () => {
      const client = await pool.connect()
      try {
        await m.down({ context: client })
        console.log(`[migrate] ✓ Reverted: ${m.name}`)
      } finally {
        client.release()
      }
    },
  })),
  storage: new PgStorage(),
  logger: console,
})
