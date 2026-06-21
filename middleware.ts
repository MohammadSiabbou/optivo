import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { PROTECTED_ROUTES, AUTH_ROUTES, ROUTES } from '@/lib/routes'

/**
 * Auth middleware.
 *
 * - Unauthenticated visits to PROTECTED_ROUTES → redirect to /login
 * - Authenticated visits to AUTH_ROUTES (login, register) → redirect to /dashboard
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get(TOKEN_COOKIE)?.value ?? null
  const payload = token ? await verifyToken(token) : null
  const isAuthenticated = payload !== null

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (isProtected && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = ROUTES.login
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = ROUTES.dashboard
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon.ico, public assets
     * - API routes (handled individually)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)',
  ],
}
