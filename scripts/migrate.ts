/**
 * Umzug-based migration runner.
 * Delegates to lib/db/umzug.ts which owns the full migration registry of .js files.
 *
 * Authentication:
 * - In Vercel deployments (VERCEL=1): AWS IAM via OIDC token (automatic, no config needed)
 * - Locally: Set PGPASSWORD in .env.development.local for direct password auth
 *   Note: Aurora PostgreSQL requires IAM auth by default. To use PGPASSWORD locally,
 *   the DB cluster must have password auth enabled for the user.
 *
 * Run:
 *   node --env-file-if-exists=.env.development.local -r tsx/esm scripts/migrate.ts
 *   node --env-file-if-exists=.env.development.local -r tsx/esm scripts/migrate.ts down
 *
 * Umzug tracks executed migrations in the `umzug_migrations` table so each migration
 * is only ever run once, in the order defined in lib/db/umzug.ts.
 */
import { Pool } from 'pg'
import { Umzug, UmzugStorage } from 'umzug'
import * as migration001 from '../lib/db/migrations/001_create_clients_table.js'
import * as migration002 from '../lib/db/migrations/002_add_social_columns.js'
import * as migration003 from '../lib/db/migrations/003_add_onboarding_completed_at.js'
import * as migration004 from '../lib/db/migrations/004_create_service_tables.js'
import * as migration005 from '../lib/db/migrations/005_create_packs_table.js'
import * as migration006 from '../lib/db/migrations/006_seed_default_services.js'

// ---------------------------------------------------------------------------
// Registry — must stay in sync with lib/db/umzug.ts
// ---------------------------------------------------------------------------
const MIGRATIONS = [
  { name: '001_create_clients_table', ...migration001 },
  { name: '002_add_social_columns', ...migration002 },
  { name: '003_add_onboarding_completed_at', ...migration003 },
  { name: '004_create_service_tables', ...migration004 },
  { name: '005_create_packs_table', ...migration005 },
  { name: '006_seed_default_services', ...migration006 },
]

// ---------------------------------------------------------------------------
// Pool — same local vs. Vercel branching as the original script
// ---------------------------------------------------------------------------
async function createPool(): Promise<Pool> {
  const host = process.env.PGHOST
  const user = process.env.PGUSER ?? 'postgres'
  const database = process.env.PGDATABASE ?? 'postgres'
  const port = 5432

  if (!host) {
    throw new Error('PGHOST environment variable is not set')
  }

  // VERCEL=1 is injected by the Vercel runtime; it is never present locally.
  const isVercel = process.env.VERCEL === '1'

  if (isVercel) {
    console.log('[migrate] Using AWS IAM authentication...')
    const { Signer } = await import('@aws-sdk/rds-signer')
    const { awsCredentialsProvider } = await import('@vercel/functions/oidc')

    const signer = new Signer({
      credentials: awsCredentialsProvider({
        roleArn: process.env.AWS_ROLE_ARN,
        clientConfig: { region: process.env.AWS_REGION },
      }),
      region: process.env.AWS_REGION,
      hostname: host,
      username: user,
      port,
    })

    return new Pool({
      host, database, port, user,
      password: () => signer.getAuthToken(),
      ssl: { rejectUnauthorized: false },
      max: 1,
    })
  } else {
    console.log('[migrate] Using direct password authentication...')
    const password = process.env.PGPASSWORD
    if (!password) {
      console.warn('[migrate] WARNING: PGPASSWORD not set. Attempting connection without password...')
    }
    return new Pool({
      host, database, port, user, password,
      ssl: process.env.PGSSL !== 'false' ? { rejectUnauthorized: false } : false,
      max: 1,
    })
  }
}

// ---------------------------------------------------------------------------
// Custom pg-backed storage — mirrors lib/db/umzug.ts PgStorage
// ---------------------------------------------------------------------------
function makePgStorage(pool: Pool): UmzugStorage {
  const TABLE = 'umzug_migrations'
  return {
    async logMigration({ name }) {
      const client = await pool.connect()
      try {
        await client.query(
          `INSERT INTO ${TABLE} (name) VALUES ($1) ON CONFLICT DO NOTHING`,
          [name],
        )
      } finally {
        client.release()
      }
    },
    async unlogMigration({ name }) {
      const client = await pool.connect()
      try {
        await client.query(`DELETE FROM ${TABLE} WHERE name = $1`, [name])
      } finally {
        client.release()
      }
    },
    async executed() {
      const client = await pool.connect()
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${TABLE} (
            name         TEXT        PRIMARY KEY,
            executed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `)
        const result = await client.query(
          `SELECT name FROM ${TABLE} ORDER BY executed_at ASC`,
        )
        return result.rows.map((r: any) => ({ name: r.name }))
      } finally {
        client.release()
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const direction = process.argv[2] === 'down' ? 'down' : 'up'
  let pool: Pool | null = null

  try {
    pool = await createPool()

    const umzug = new Umzug({
      migrations: MIGRATIONS.map((m) => ({
        name: m.name,
        up: async () => {
          const client = await pool!.connect()
          try {
            await m.up({ context: client })
          } finally {
            client.release()
          }
        },
        down: async () => {
          const client = await pool!.connect()
          try {
            await m.down({ context: client })
          } finally {
            client.release()
          }
        },
      })),
      storage: makePgStorage(pool),
      logger: console,
    })

    if (direction === 'down') {
      console.log('[migrate] Running down migration (last step)...')
      await umzug.down()
    } else {
      console.log('[migrate] Running pending migrations...')
      const pending = await umzug.pending()
      if (pending.length === 0) {
        console.log('[migrate] No pending migrations.')
      } else {
        console.log(`[migrate] Found ${pending.length} pending migration(s):`)
        pending.forEach((m) => console.log(`  - ${m.name}`))
        await umzug.up()
        console.log(`[migrate] Done — executed ${pending.length} migration(s).`)
      }
    }
  } catch (err: any) {
    console.error('[migrate] Error:', err.message || err)

    if (err.code === '28P01' || err.message?.includes('authentication') || err.message?.includes('PAM')) {
      console.error('\n[migrate] Authentication failed.')
      if (process.env.VERCEL !== '1') {
        console.error('   Aurora PostgreSQL uses IAM auth by default. To run migrations locally,')
        console.error('   either deploy to Vercel (where IAM auth works automatically),')
        console.error('   or set PGPASSWORD in .env.development.local if your cluster allows password auth.\n')
      }
    }

    if (err.code === 'ECONNREFUSED') {
      console.error('\n[migrate] Connection refused. Make sure:')
      console.error(`   - PGHOST is set     (current: ${process.env.PGHOST})`)
      console.error(`   - PGUSER is set     (current: ${process.env.PGUSER})`)
      console.error(`   - PGDATABASE is set (current: ${process.env.PGDATABASE})\n`)
    }

    process.exit(1)
  } finally {
    if (pool) await pool.end()
  }
}

main()
