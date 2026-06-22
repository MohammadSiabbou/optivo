/**
 * Validation rules for packs.
 *
 * All functions accept a locale and use getMessage (no hardcoded strings).
 * Confirmed decisions:
 *   - Primary image is required (user confirmed).
 *   - Feature lines capped at 30 per pack (user confirmed).
 *   - Total images capped at 10 including primary.
 */
import { getMessage } from '@/lib/i18n'
import type { FieldErrors } from '@/modules/clients/validation'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PACK_MAX_IMAGES = 10
export const PACK_MAX_FEATURES = 30
export const PACK_IMAGE_MAX_BYTES = 5 * 1024 * 1024 // 5 MB (matches LOGO_MAX_BYTES)

// ---------------------------------------------------------------------------
// Field validators
// ---------------------------------------------------------------------------

export function validatePackName(name: string, locale: string = 'en'): string | null {
  const trimmed = name?.trim() ?? ''
  if (!trimmed) return getMessage(locale, 'packs.validation.nameRequired')
  if (trimmed.length < 2 || trimmed.length > 120) {
    return getMessage(locale, 'packs.validation.nameLength')
  }
  return null
}

export function validatePrice(value: unknown, locale: string = 'en'): string | null {
  if (value === null || value === undefined || value === '') {
    return getMessage(locale, 'packs.validation.priceRequired')
  }
  const num = Number(value)
  if (Number.isNaN(num) || num < 0) {
    return getMessage(locale, 'packs.validation.priceInvalid')
  }
  return null
}

export function validateOldPrice(
  value: unknown,
  price: number,
  locale: string = 'en',
): string | null {
  if (value === null || value === undefined || value === '') return null // optional
  const num = Number(value)
  if (Number.isNaN(num) || num < 0) {
    return getMessage(locale, 'packs.validation.oldPriceInvalid')
  }
  return null
}

export function validateFeatures(lines: string[], locale: string = 'en'): string | null {
  const trimmed = lines.map((l) => l.trim()).filter(Boolean)
  if (trimmed.length > PACK_MAX_FEATURES) {
    return getMessage(locale, 'packs.validation.tooManyFeatures')
  }
  for (const line of trimmed) {
    if (line.length > 120) return getMessage(locale, 'packs.validation.featureTooLong')
  }
  return null
}

export function validateImages(
  primaryUrl: string | null | undefined,
  imageUrls: string[],
  locale: string = 'en',
): string | null {
  // Primary image is required
  if (!primaryUrl || primaryUrl.trim() === '') {
    return getMessage(locale, 'packs.validation.primaryImageRequired')
  }
  const total = imageUrls.length + 1 // +1 for primary
  if (total > PACK_MAX_IMAGES) {
    return getMessage(locale, 'packs.validation.tooManyImages')
  }
  return null
}

// ---------------------------------------------------------------------------
// Payload interfaces
// ---------------------------------------------------------------------------

export interface CreatePackPayload {
  name: string
  price: number
  old_price?: number | null
  primary_image_url: string
  image_urls?: string[]
  features?: string[]
  sort_order?: number
}

export interface UpdatePackPayload {
  name?: string
  price?: number
  old_price?: number | null
  primary_image_url?: string | null
  image_urls?: string[]
  features?: string[]
  sort_order?: number
}

// ---------------------------------------------------------------------------
// Aggregate validators
// ---------------------------------------------------------------------------

export function validateCreatePack(
  payload: CreatePackPayload,
  locale: string = 'en',
): FieldErrors<CreatePackPayload> {
  const errors: FieldErrors<CreatePackPayload> = {}

  const name = validatePackName(payload.name, locale)
  if (name) errors.name = name

  const price = validatePrice(payload.price, locale)
  if (price) errors.price = price

  if (payload.old_price !== undefined && payload.old_price !== null) {
    const oldPrice = validateOldPrice(payload.old_price, Number(payload.price), locale)
    if (oldPrice) errors.old_price = oldPrice
  }

  const features = validateFeatures(payload.features ?? [], locale)
  if (features) errors.features = features

  const images = validateImages(
    payload.primary_image_url,
    payload.image_urls ?? [],
    locale,
  )
  if (images) errors.primary_image_url = images

  return errors
}

export function validateUpdatePack(
  payload: UpdatePackPayload,
  locale: string = 'en',
): FieldErrors<UpdatePackPayload> {
  const errors: FieldErrors<UpdatePackPayload> = {}

  if (payload.name !== undefined) {
    const name = validatePackName(payload.name, locale)
    if (name) errors.name = name
  }

  if (payload.price !== undefined) {
    const price = validatePrice(payload.price, locale)
    if (price) errors.price = price
  }

  if (payload.old_price !== undefined && payload.old_price !== null) {
    const oldPrice = validateOldPrice(payload.old_price, Number(payload.price ?? 0), locale)
    if (oldPrice) errors.old_price = oldPrice
  }

  if (payload.features !== undefined) {
    const features = validateFeatures(payload.features, locale)
    if (features) errors.features = features
  }

  if (payload.primary_image_url !== undefined) {
    const images = validateImages(
      payload.primary_image_url,
      payload.image_urls ?? [],
      locale,
    )
    if (images) errors.primary_image_url = images
  }

  return errors
}
