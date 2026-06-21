/**
 * POST /api/packs/upload-image
 *
 * Accepts multipart/form-data with a "file" field.
 * Validates size (max 5 MB), uploads to Vercel Blob (public store),
 * and returns { url }.
 *
 * Mirrors upload-logo exactly, with a different blob folder.
 * Requires: httpOnly JWT cookie (optivo_token)
 */
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth/jwt'
import { PACK_IMAGE_MAX_BYTES } from '@/modules/packs/validation'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > PACK_IMAGE_MAX_BYTES) {
      return NextResponse.json(
        { error: `File exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).` },
        { status: 413 },
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are accepted.' }, { status: 415 })
    }

    const blob = await put(`packs/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[upload-pack-image]', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
