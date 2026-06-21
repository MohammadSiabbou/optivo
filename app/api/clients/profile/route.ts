/**
 * PATCH /api/clients/profile
 *
 * Body: { name, logo_url? }
 * Requires: httpOnly JWT cookie (optivo_token)
 * Returns: { client } on success or { error } with appropriate status.
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { buildClientDeps } from '@/modules/clients/factory'

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
    }

    const body = await request.json()
    const { updateProfileUseCase } = buildClientDeps()

    const client = await updateProfileUseCase.execute(payload.sub, {
      name: body.name ?? '',
      logo_url: body.logo_url ?? null,
    })

    return NextResponse.json({ client })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed.'
    const status = message.startsWith('Validation failed') ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
