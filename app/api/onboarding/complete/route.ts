/**
 * POST /api/onboarding/complete
 *
 * Sets onboarding_completed_at = now() for the authenticated studio.
 * Requires: httpOnly JWT cookie (optivo_token)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { buildClientDeps } from '@/modules/clients/factory'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const { completeOnboardingUseCase } = buildClientDeps()
    await completeOnboardingUseCase.execute(payload.sub)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/onboarding/complete]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
