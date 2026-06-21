/**
 * PATCH /api/clients/socials
 *
 * Body: { instagram_url?, facebook_url?, linkedin_url?, twitter_url? }
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
    const { updateSocialsUseCase } = buildClientDeps()

    const client = await updateSocialsUseCase.execute(payload.sub, {
      instagram_url: body.instagram_url ?? '',
      facebook_url: body.facebook_url ?? '',
      linkedin_url: body.linkedin_url ?? '',
      twitter_url: body.twitter_url ?? '',
    })

    return NextResponse.json({ client })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed.'
    const status = message.startsWith('Validation failed') ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
