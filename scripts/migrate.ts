/**
 * One-shot migration runner.
 * Reads and executes all .sql files from lib/db/migrations in order.
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
    // Read and execute all .sql files in migrations directory
    const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations')
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf-8')
      console.log(`[migrate] Running ${file}...`)
      await client.query(sql)
      console.log(`[migrate] ✓ ${file} completed`)
    }

    console.log('[migrate] All migrations completed successfully.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[migrate] Error:', err)
  process.exit(1)
})
