/**
 * One-shot migration runner.
 * Run with: node --env-file-if-exists=/vercel/share/.env.project -r tsx/esm scripts/migrate.ts
 */
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT        NOT NULL,
        email       TEXT        NOT NULL UNIQUE,
        password    TEXT        NOT NULL,
        logo_url    TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)
    console.log('[migrate] clients table ready.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[migrate] Error:', err)
  process.exit(1)
})
