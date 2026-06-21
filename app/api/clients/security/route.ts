/**
 * PATCH /api/clients/security
 *
 * Body: { currentPassword, newPassword, confirmNewPassword }
 * Requires: httpOnly JWT cookie (optivo_token)
 * Returns: 204 No Content on success or { error } with appropriate status.
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
    const { changePasswordUseCase } = buildClientDeps()

    await changePasswordUseCase.execute(payload.sub, {
      currentPassword: body.currentPassword ?? '',
      newPassword: body.newPassword ?? '',
      confirmNewPassword: body.confirmNewPassword ?? '',
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed.'
    const isValidation = message.startsWith('Validation failed')
    const isWrongPw = message.includes('incorrect')
    const status = isValidation || isWrongPw ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
