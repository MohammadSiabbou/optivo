/**
 * Migration: Create clients table
 * 
 * Umzug migration with up/down functions for Aurora PostgreSQL.
 */

export async function up({ context: client }) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT        NOT NULL,
      email       TEXT        NOT NULL UNIQUE,
      password    TEXT        NOT NULL,
      logo_url    TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

export async function down({ context: client }) {
  await client.query('DROP TABLE IF EXISTS clients')
}
