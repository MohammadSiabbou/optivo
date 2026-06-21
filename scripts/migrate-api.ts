/**
 * Migration runner via internal API endpoint.
 * Calls POST /api/internal/migrate with the MIGRATE_SECRET header.
 *
 * Usage:
 *   node --env-file-if-exists=.env.development.local -r tsx/esm scripts/migrate-api.ts
 *   OR in Vercel:
 *   node --env-file-if-exists=/vercel/share/.env.project -r tsx/esm scripts/migrate-api.ts
 *
 * Requires:
 * - MIGRATE_SECRET env var
 * - Dev server running on $DEV_PORT (default 3000)
 */

async function main() {
  const migrateSecret = process.env.MIGRATE_SECRET
  if (!migrateSecret) {
    console.error('[migrate-api] Error: MIGRATE_SECRET environment variable is not set')
    process.exit(1)
  }

  const devPort = process.env.DEV_PORT || '3000'
  const baseUrl = `http://localhost:${devPort}`
  const endpoint = `${baseUrl}/api/internal/migrate`

  try {
    console.log(`[migrate-api] Calling ${endpoint}...`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-migrate-secret': migrateSecret,
      },
    })

    const json = await response.json()

    if (!response.ok) {
      console.error(`[migrate-api] Error (${response.status}):`, json.error)
      if (json.detail) {
        console.error('[migrate-api] Detail:', json.detail)
      }
      process.exit(1)
    }

    if (json.message) {
      console.log(`[migrate-api] ${json.message}`)
    }

    if (json.executed?.length > 0) {
      console.log(`[migrate-api] ✓ Executed ${json.count} migration(s):`)
      json.executed.forEach((name: string) => console.log(`  - ${name}`))
    }

    console.log('[migrate-api] Done')
  } catch (err: any) {
    console.error('[migrate-api] Failed to connect:', err.message)
    console.error('[migrate-api] Make sure:')
    console.error(`  - Dev server is running on http://localhost:${devPort}`)
    console.error('  - MIGRATE_SECRET is set in your environment')
    process.exit(1)
  }
}

main()
