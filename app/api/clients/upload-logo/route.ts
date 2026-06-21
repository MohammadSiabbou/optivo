/**
 * POST /api/clients/upload-logo
 *
 * Accepts a multipart/form-data request with a "file" field.
 * Validates size (max 5 MB), uploads to Vercel Blob (public store),
 * and returns { url } for use in the register form.
 */
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { LOGO_MAX_BYTES } from '@/modules/clients/validation'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > LOGO_MAX_BYTES) {
      return NextResponse.json(
        { error: `File exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).` },
        { status: 413 },
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are accepted.' }, { status: 415 })
    }

    const blob = await put(`logos/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[upload-logo]', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
