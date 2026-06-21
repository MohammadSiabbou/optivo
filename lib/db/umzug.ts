/**
 * Umzug migration configuration for Aurora PostgreSQL with raw pg driver.
 * Reads .sql migration files from lib/db/migrations/ in order.
 */
import fs from 'fs'
import path from 'path'
import { Umzug, UmzugStorage } from 'umzug'
import { pool } from './pool'

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
  migrations: {
    glob: 'lib/db/migrations/*.sql',
    resolve: ({ name, path: filePath }) => {
      return {
        name,
        up: async () => {
          const client = await pool.connect()
          try {
            const sql = fs.readFileSync(filePath!, 'utf-8')
            await client.query(sql)
            console.log(`[migrate] ✓ Executed: ${name}`)
          } finally {
            client.release()
          }
        },
        down: async () => {
          console.log(`[migrate] Skipping down migration for ${name}`)
        },
      }
    },
  },
  storage: new PgStorage(),
  logger: console,
})
