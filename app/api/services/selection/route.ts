/**
 * PUT /api/services/selection
 *
 * Body: { category, definitionIds, customServices }
 * Saves a studio's service selections for one category.
 * Requires: httpOnly JWT cookie (optivo_token)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { buildServiceDeps } from '@/modules/services/factory'

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const body = await request.json()
    const { saveServiceSelectionUseCase } = buildServiceDeps()

    const catalog = await saveServiceSelectionUseCase.execute(payload.sub, {
      category: body.category,
      definitionIds: body.definitionIds ?? [],
      customServices: body.customServices ?? [],
    })

    return NextResponse.json(catalog)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed.'
    const status = message.startsWith('Validation failed') ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
