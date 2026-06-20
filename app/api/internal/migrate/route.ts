/**
 * Internal migration endpoint — run once to create the clients table.
 * Only callable with the correct MIGRATE_SECRET header to prevent abuse.
 *
 * POST /api/internal/migrate
 * Header: x-migrate-secret: <MIGRATE_SECRET env var>
 */
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function POST(request: Request) {
  const secret = request.headers.get('x-migrate-secret')
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    return NextResponse.json({ ok: true, message: 'clients table ready.' })
  } catch (err) {
    console.error('[migrate] Error:', err)
    return NextResponse.json({ error: 'Migration failed', detail: String(err) }, { status: 500 })
  } finally {
    client.release()
  }
}
