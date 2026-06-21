/**
 * POST /api/clients/logout
 *
 * Clears the httpOnly JWT cookie and redirects to /login.
 */
import { NextResponse } from 'next/server'
import { makeClearCookieValue } from '@/lib/auth/jwt'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', makeClearCookieValue())
  return response
}
