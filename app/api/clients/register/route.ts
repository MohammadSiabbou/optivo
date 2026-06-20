/**
 * POST /api/clients/register
 *
 * Body: { name, email, password, confirmPassword, logo_url? }
 * On success: sets httpOnly JWT cookie and returns the safe client DTO.
 */
import { NextResponse } from 'next/server'
import { buildClientDeps } from '@/lib/clients/factory'
import { signToken, makeSetCookieValue, TOKEN_COOKIE } from '@/lib/auth/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { registerUseCase } = buildClientDeps()

    const client = await registerUseCase.execute({
      name: body.name ?? '',
      email: body.email ?? '',
      password: body.password ?? '',
      confirmPassword: body.confirmPassword ?? '',
      logo_url: body.logo_url ?? null,
    })

    const token = await signToken({
      sub: client.id,
      email: client.email,
      name: client.name,
    })

    const response = NextResponse.json({ client }, { status: 201 })
    response.headers.set('Set-Cookie', makeSetCookieValue(token))
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed.'
    const status = message.includes('already exists') ? 409 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
