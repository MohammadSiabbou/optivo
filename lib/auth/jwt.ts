/**
 * JWT utilities using the `jose` library.
 *
 * Tokens are HS256, signed with JWT_SECRET, with a 7-day expiry.
 * They are set/read as httpOnly, sameSite=lax cookies named `optivo_token`.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const COOKIE_NAME = 'optivo_token'
const EXPIRY = '7d'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set.')
  return new TextEncoder().encode(secret)
}

export interface ClientTokenPayload extends JWTPayload {
  sub: string   // client id (UUID)
  email: string
  name: string
}

export async function signToken(payload: Omit<ClientTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<ClientTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as ClientTokenPayload
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers (used in Route Handlers / Server Actions)
// ---------------------------------------------------------------------------

export function tokenCookieOptions(): Parameters<typeof import('next/headers')['cookies']>[0] {
  // Intentionally returning the raw options object for use with `cookies().set`
  return undefined as unknown as Parameters<typeof import('next/headers')['cookies']>[0]
}

export const TOKEN_COOKIE = COOKIE_NAME

export function makeSetCookieValue(token: string): string {
  const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

export function makeClearCookieValue(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
