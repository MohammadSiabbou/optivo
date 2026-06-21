/**
 * Migration: Add onboarding_completed_at column to clients table
 *
 * NULL = studio still needs the wizard; a timestamp = onboarded.
 */

export async function up({ context: client }) {
  await client.query(`
    ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ
  `)
}

export async function down({ context: client }) {
  await client.query(`
    ALTER TABLE clients
      DROP COLUMN IF EXISTS onboarding_completed_at
  `)
}
