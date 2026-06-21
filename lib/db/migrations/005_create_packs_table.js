/**
 * Migration: Create packs table
 *
 * One row per pack. image_urls and features stored as JSONB arrays.
 * price / old_price are NUMERIC(10,2); pg returns them as strings.
 */

export async function up({ context: client }) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS packs (
      id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id         UUID           NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      name              TEXT           NOT NULL,
      price             NUMERIC(10,2)  NOT NULL,
      old_price         NUMERIC(10,2),
      primary_image_url TEXT,
      image_urls        JSONB          NOT NULL DEFAULT '[]',
      features          JSONB          NOT NULL DEFAULT '[]',
      sort_order        INT            NOT NULL DEFAULT 0,
      created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
    )
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS packs_client_id_idx ON packs (client_id)
  `)
}

export async function down({ context: client }) {
  await client.query('DROP TABLE IF EXISTS packs')
}
