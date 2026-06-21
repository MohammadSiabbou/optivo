/**
 * Internal migration endpoint — run once to execute all database migrations.
 * Only callable with the correct MIGRATE_SECRET header to prevent abuse.
 *
 * Uses Umzug to track and execute all .sql files from lib/db/migrations.
 *
 * POST /api/internal/migrate
 * Header: x-migrate-secret: <MIGRATE_SECRET env var>
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
      return NextResponse.json({ ok: true, message: 'No pending migrations', executed: [] })
    }

    console.log(`[migrate] Running ${pending.length} pending migration(s)`)
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
