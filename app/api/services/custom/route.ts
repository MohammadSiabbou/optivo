/**
 * POST /api/services/custom   — add a custom service definition
 * DELETE /api/services/custom?id= — remove a custom definition
 *
 * Requires: httpOnly JWT cookie (optivo_token)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { buildServiceDeps } from '@/modules/services/factory'

async function getPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const body = await request.json()
    const { addCustomServiceUseCase } = buildServiceDeps()

    const dto = await addCustomServiceUseCase.execute(payload.sub, {
      label: body.label ?? '',
      icon: body.icon,
      category: body.category ?? '',
    })

    return NextResponse.json(dto)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed.'
    const status = message.startsWith('Validation failed') ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

    const { deleteCustomServiceUseCase } = buildServiceDeps()
    await deleteCustomServiceUseCase.execute(payload.sub, id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/services/custom DELETE]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
