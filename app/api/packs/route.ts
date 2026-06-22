/**
 * GET  /api/packs — list packs for the authenticated studio
 * POST /api/packs — create a new pack
 *
 * Requires: httpOnly JWT cookie (optivo_token)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { buildPackDeps } from '@/modules/packs/factory'

async function getPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET() {
  try {
    const payload = await getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const { listPacksUseCase } = buildPackDeps()
    const packs = await listPacksUseCase.execute(payload.sub)

    return NextResponse.json({ packs })
  } catch (err) {
    console.error('[api/packs GET]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const body = await request.json()
    const { createPackUseCase } = buildPackDeps()

    const pack = await createPackUseCase.execute(payload.sub, {
      name: body.name ?? '',
      price: body.price,
      old_price: body.old_price ?? null,
      primary_image_url: body.primary_image_url ?? '',
      image_urls: body.image_urls ?? [],
      features: body.features ?? [],
      sort_order: body.sort_order ?? 0,
    })

    return NextResponse.json({ pack }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed.'
    const status = message.startsWith('Validation failed') ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
