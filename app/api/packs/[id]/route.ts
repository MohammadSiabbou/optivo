/**
 * PATCH  /api/packs/[id] — update a pack
 * DELETE /api/packs/[id] — delete a pack
 *
 * Requires: httpOnly JWT cookie (optivo_token)
 * params must be awaited (Next.js 16 async params).
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { updatePackUseCase } = buildPackDeps()

    const pack = await updatePackUseCase.execute(payload.sub, id, {
      name: body.name,
      price: body.price,
      old_price: body.old_price,
      primary_image_url: body.primary_image_url,
      image_urls: body.image_urls,
      features: body.features,
      sort_order: body.sort_order,
    })

    return NextResponse.json({ pack })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed.'
    const status = message.startsWith('Validation failed') ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const { id } = await params
    const { deletePackUseCase } = buildPackDeps()
    await deletePackUseCase.execute(payload.sub, id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/packs DELETE]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
