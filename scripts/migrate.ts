/**
 * Umzug-based migration runner.
 * Executes all .sql files from lib/db/migrations in order, tracking execution state.
 * 
 * Authentication modes:
 * - AWS IAM (Vercel): Uses VERCEL_OIDC_TOKEN + AWS_ROLE_ARN (automatic in Vercel deployments)
 * - Direct password: Uses PGPASSWORD env var (for local development with direct DB access)
 *
 * Usage:
 * 
 * In Vercel preview deployments (automatic):
 *   ✓ Runs via deployment hooks with AWS IAM credentials
 * 
 * Locally with direct DB access:
 *   1. Set PGPASSWORD in your .env file with your actual DB password
 *   2. Run: node --env-file-if-exists=.env.development.local -r tsx/esm scripts/migrate.ts
 *
 * Notes:
 * - The umzug_migrations table tracks which migrations have been executed
 * - Migrations are idempotent and only run once
 * - SQL files in lib/db/migrations/ are executed in alphabetical order
 */
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

async function createPool(): Promise<Pool> {
  const host = process.env.PGHOST
  const user = process.env.PGUSER ?? 'postgres'
  const database = process.env.PGDATABASE ?? 'postgres'
  const port = 5432

  if (!host) {
    throw new Error('PGHOST environment variable is not set')
  }

  // Prefer direct password auth if PGPASSWORD is set (local development)
  // Otherwise use AWS IAM (Vercel deployments only)
  const useDirectAuth = !!process.env.PGPASSWORD
  const isVercel = !useDirectAuth && process.env.AWS_ROLE_ARN && process.env.AWS_REGION

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
      host,
      database,
      port,
      user,
      password: () => signer.getAuthToken(),
      ssl: { rejectUnauthorized: false },
      max: 1,
    })
  } else {
    // Local development: use PGPASSWORD env var
    console.log('[migrate] Using direct password authentication...')
    const password = process.env.PGPASSWORD

    if (!password) {
      console.warn('[migrate] ⚠️  PGPASSWORD not set. Attempting connection without password...')
    }

    return new Pool({
      host,
      database,
      port,
      user,
      password,
      ssl: process.env.PGSSL !== 'false' ? { rejectUnauthorized: false } : false,
      max: 1,
    })
  }
}

async function main() {
  let pool: Pool | null = null

  try {
    pool = await createPool()
    const client = await pool.connect()

    try {
      console.log('[migrate] Initializing Umzug...')

      // Create migrations tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS umzug_migrations (
          name TEXT PRIMARY KEY,
          executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)

      // Get list of executed migrations
      const result = await client.query('SELECT name FROM umzug_migrations ORDER BY executed_at ASC')
      const executed = new Set(result.rows.map((r: any) => r.name))

      // Read all migration files
      const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations')
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

      const pending = files.filter((f) => !executed.has(f))

      if (pending.length === 0) {
        console.log('[migrate] No pending migrations.')
        return
      }

      console.log(`[migrate] Found ${pending.length} pending migration(s):`)
      pending.forEach((m) => console.log(`  - ${m}`))

      // Execute pending migrations
      for (const file of pending) {
        const filePath = path.join(migrationsDir, file)
        const sql = fs.readFileSync(filePath, 'utf-8')
        console.log(`[migrate] Running ${file}...`)
        await client.query(sql)

        // Record migration
        await client.query(
          'INSERT INTO umzug_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
          [file]
        )
        console.log(`[migrate] ✓ ${file}`)
      }

      console.log(`[migrate] ✓ Successfully executed ${pending.length} migration(s)`)
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error('[migrate] Error:', err.message || err)
    
    // Helpful guidance for common errors
    if (err.code === '28P01' || err.message?.includes('authentication')) {
      console.error('\n[migrate] 💡 Authentication failed. For local development:')
      console.error('   1. Remove PGPASSWORD from .env.development.local')
      console.error('   2. Ensure VERCEL_OIDC_TOKEN is available in your environment')
      console.error('   3. The sandbox VM provides AWS IAM credentials automatically\n')
    }
    
    if (err.code === 'ECONNREFUSED') {
      console.error('\n[migrate] 💡 Connection refused. Make sure:')
      console.error(`   - PGHOST is set (current: ${process.env.PGHOST})`)
      console.error(`   - PGUSER is set (current: ${process.env.PGUSER})`)
      console.error(`   - PGDATABASE is set (current: ${process.env.PGDATABASE})\n`)
    }
    
    process.exit(1)
  } finally {
    if (pool) {
      await pool.end()
    }
  }
}

main()
