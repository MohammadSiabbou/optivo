/**
 * Migration: Create service_definitions and client_services tables
 *
 * service_definitions — shared catalog (system defaults + per-studio custom).
 * client_services     — join table recording which definitions a studio offers.
 */

export async function up({ context: client }) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS service_definitions (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id    UUID        REFERENCES clients(id) ON DELETE CASCADE,
      category     TEXT        NOT NULL,
      icon         TEXT        NOT NULL,
      name_key     TEXT,
      custom_label TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS service_definitions_category_idx
      ON service_definitions (category)
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS service_definitions_client_id_idx
      ON service_definitions (client_id)
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS client_services (
      id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id             UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      service_definition_id UUID        NOT NULL REFERENCES service_definitions(id) ON DELETE CASCADE,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (client_id, service_definition_id)
    )
  `)
}

export async function down({ context: client }) {
  await client.query('DROP TABLE IF EXISTS client_services')
  await client.query('DROP TABLE IF EXISTS service_definitions')
}
