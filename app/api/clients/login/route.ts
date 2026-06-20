/**
 * POST /api/clients/login
 *
 * Body: { email, password }
 * On success: sets httpOnly JWT cookie and returns the safe client DTO.
 */
import { NextResponse } from 'next/server'
import { buildClientDeps } from '@/lib/clients/factory'
import { signToken, makeSetCookieValue } from '@/lib/auth/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { loginUseCase } = buildClientDeps()

    const client = await loginUseCase.execute({
      email: body.email ?? '',
      password: body.password ?? '',
    })

    const token = await signToken({
      sub: client.id,
      email: client.email,
      name: client.name,
    })

    const response = NextResponse.json({ client })
    response.headers.set('Set-Cookie', makeSetCookieValue(token))
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed.'
    // Always return 401 for auth failures to avoid enumeration
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
