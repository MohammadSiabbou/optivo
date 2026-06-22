/**
 * Validation rules for services.
 *
 * All functions accept a locale and use getMessage (no hardcoded strings).
 */
import { getMessage } from '@/lib/i18n'
import type { FieldErrors } from '@/modules/clients/validation'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SERVICE_CATEGORIES = ['photo', 'video'] as const
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

// ---------------------------------------------------------------------------
// Field validators
// ---------------------------------------------------------------------------

export function validateCustomServiceLabel(label: string, locale: string = 'en'): string | null {
  const trimmed = label?.trim() ?? ''
  if (!trimmed) return getMessage(locale, 'services.validation.customLabelRequired')
  if (trimmed.length < 2 || trimmed.length > 80) {
    return getMessage(locale, 'services.validation.customLabelLength')
  }
  return null
}

export function validateCategory(category: string, locale: string = 'en'): string | null {
  if (!SERVICE_CATEGORIES.includes(category as ServiceCategory)) {
    return getMessage(locale, 'services.validation.categoryInvalid')
  }
  return null
}

// ---------------------------------------------------------------------------
// Payload interfaces
// ---------------------------------------------------------------------------

export interface CustomServiceInput {
  label: string
  icon?: string
}

export interface SaveServiceSelectionPayload {
  category: ServiceCategory
  definitionIds: string[]
  customServices: CustomServiceInput[]
}

// ---------------------------------------------------------------------------
// Aggregate validator
// ---------------------------------------------------------------------------

export function validateServiceSelection(
  payload: SaveServiceSelectionPayload,
  locale: string = 'en',
): FieldErrors<SaveServiceSelectionPayload> {
  const errors: FieldErrors<SaveServiceSelectionPayload> = {}

  const categoryErr = validateCategory(payload.category, locale)
  if (categoryErr) errors.category = categoryErr

  for (const custom of payload.customServices ?? []) {
    const labelErr = validateCustomServiceLabel(custom.label, locale)
    if (labelErr) {
      errors.customServices = labelErr
      break
    }
  }

  return errors
}
