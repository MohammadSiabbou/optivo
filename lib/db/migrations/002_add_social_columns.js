/**
 * Migration: Add social media URL columns to clients table
 *
 * Adds four nullable TEXT columns for Instagram, Facebook, LinkedIn,
 * and Twitter/X profile URLs.
 */

export async function up({ context: client }) {
  await client.query(`
    ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS instagram_url TEXT,
      ADD COLUMN IF NOT EXISTS facebook_url  TEXT,
      ADD COLUMN IF NOT EXISTS linkedin_url  TEXT,
      ADD COLUMN IF NOT EXISTS twitter_url   TEXT
  `)
}

export async function down({ context: client }) {
  await client.query(`
    ALTER TABLE clients
      DROP COLUMN IF EXISTS instagram_url,
      DROP COLUMN IF EXISTS facebook_url,
      DROP COLUMN IF EXISTS linkedin_url,
      DROP COLUMN IF EXISTS twitter_url
  `)
}
