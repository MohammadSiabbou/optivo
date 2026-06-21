/**
 * Internal migration endpoint — protected with MIGRATE_SECRET header.
 * Executes all pending .js migrations from lib/db/migrations.
 * Uses Umzug to track and manage migration state.
 *
 * POST /api/internal/migrate
 * Header: x-migrate-secret: <MIGRATE_SECRET env var>
 *
 * Response:
 * {
 *   ok: true,
 *   executed: ["001_create_clients_table.js"],
 *   count: 1,
 *   message?: "No pending migrations"
 * }
 */
import { NextResponse } from 'next/server'
import { umzug } from '@/lib/db/umzug'

export async function POST(request: Request) {
  const secret = request.headers.get('x-migrate-secret')
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pending = await umzug.pending()

    if (pending.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No pending migrations',
        executed: [],
        count: 0,
      })
    }

    console.log(`[migrate] Running ${pending.length} pending migration(s) via API`)
    const executed = await umzug.up()

    return NextResponse.json({
      ok: true,
      executed: executed.map((m) => m.name),
      count: executed.length,
    })
  } catch (err) {
    console.error('[migrate] Error:', err)
    return NextResponse.json(
      { error: 'Migration failed', detail: String(err) },
      { status: 500 }
    )
  }
}
