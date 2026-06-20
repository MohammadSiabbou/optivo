/**
 * Internal migration endpoint — run once to execute all database migrations.
 * Only callable with the correct MIGRATE_SECRET header to prevent abuse.
 *
 * Reads and executes all .sql files from lib/db/migrations in order.
 *
 * POST /api/internal/migrate
 * Header: x-migrate-secret: <MIGRATE_SECRET env var>
 */
import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function POST(request: Request) {
  const secret = request.headers.get('x-migrate-secret')
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect()
  try {
    // Read and execute all .sql files in migrations directory
    const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations')
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

    const results: string[] = []
    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf-8')
      console.log(`[migrate] Running ${file}...`)
      await client.query(sql)
      results.push(`✓ ${file}`)
    }

    return NextResponse.json({ ok: true, migrations: results })
  } catch (err) {
    console.error('[migrate] Error:', err)
    return NextResponse.json({ error: 'Migration failed', detail: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
