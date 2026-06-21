/**
 * GET /api/services/catalog?category=photo|video
 *
 * Returns { defaults, custom, selectedIds } for the authenticated studio.
 * Requires: httpOnly JWT cookie (optivo_token)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { buildServiceDeps } from '@/modules/services/factory'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') ?? undefined

    const { getServiceCatalogUseCase } = buildServiceDeps()
    const catalog = await getServiceCatalogUseCase.execute(payload.sub, category)

    return NextResponse.json(catalog)
  } catch (err) {
    console.error('[api/services/catalog]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
