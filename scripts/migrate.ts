/**
 * Umzug-based migration runner.
 * Executes all .sql files from lib/db/migrations in order, tracking execution state.
 * Run with: node --env-file-if-exists=/vercel/share/.env.project -r tsx/esm scripts/migrate.ts
 */
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { Signer } from '@aws-sdk/rds-signer'
import { awsCredentialsProvider } from '@vercel/functions/oidc'

async function main() {
  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION! },
    }),
    region: process.env.AWS_REGION!,
    hostname: process.env.PGHOST!,
    username: process.env.PGUSER ?? 'postgres',
    port: 5432,
  })

  const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE ?? 'postgres',
    port: 5432,
    user: process.env.PGUSER ?? 'postgres',
    password: () => signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
    max: 1,
  })

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
  } catch (err) {
    console.error('[migrate] Error:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
