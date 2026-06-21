/**
 * Shared validation rules for client (photographer/studio) auth.
 *
 * All validation functions accept a locale parameter and use i18n messages.
 * This ensures consistent error messages between frontend and backend.
 */
import { getMessage } from '@/lib/i18n'

// ---------------------------------------------------------------------------
// Preferred logo dimensions (px)
// ---------------------------------------------------------------------------
export const LOGO_PREFERRED = { minW: 200, maxW: 800, minH: 60, maxH: 240 } as const
export const LOGO_MAX_BYTES = 5 * 1024 * 1024 // 5 MB

// ---------------------------------------------------------------------------
// Field rules
// ---------------------------------------------------------------------------

export function validateName(name: string, locale: string = 'en'): string | null {
  if (!name || name.trim().length === 0) return getMessage(locale, 'auth.validation.nameRequired')
  if (name.trim().length < 2) return getMessage(locale, 'auth.validation.nameMinLength')
  if (name.trim().length > 120) return getMessage(locale, 'auth.validation.nameMaxLength')
  return null
}

export function validateEmail(email: string, locale: string = 'en'): string | null {
  if (!email || email.trim().length === 0) return getMessage(locale, 'auth.validation.emailRequired')
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email.trim())) return getMessage(locale, 'auth.validation.emailInvalid')
  if (email.length > 254) return getMessage(locale, 'auth.validation.emailInvalid')
  return null
}

export function validatePassword(password: string, locale: string = 'en'): string | null {
  if (!password) return getMessage(locale, 'auth.validation.passwordRequired')
  if (password.length < 8) return getMessage(locale, 'auth.validation.passwordMinLength')
  if (password.length > 72) return getMessage(locale, 'auth.validation.passwordMinLength')
  if (!/[0-9]/.test(password)) return getMessage(locale, 'auth.validation.passwordNoNumber')
  return null
}

export function validatePasswordConfirm(password: string, confirm: string, locale: string = 'en'): string | null {
  if (!confirm) return getMessage(locale, 'auth.validation.passwordRequired')
  if (password !== confirm) return getMessage(locale, 'auth.validation.passwordMismatch')
  return null
}

// ---------------------------------------------------------------------------
// Logo dimension warning (non-blocking)
// ---------------------------------------------------------------------------
export function logoSizeWarning(width: number, height: number, locale: string = 'en'): string | null {
  const { minW, maxW, minH, maxH } = LOGO_PREFERRED
  if (width < minW || width > maxW || height < minH || height > maxH) {
    return getMessage(locale, 'auth.validation.dimensionWarning', { 
      width: `${width}×${height}`, 
      height: `${minW}×${minH}`
    })
  }
  return null
}

// ---------------------------------------------------------------------------
// Aggregate payloads
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginPayload {
  email: string
  password: string
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function validateRegister(payload: RegisterPayload, locale: string = 'en'): FieldErrors<RegisterPayload> {
  const errors: FieldErrors<RegisterPayload> = {}
  const name = validateName(payload.name, locale)
  const email = validateEmail(payload.email, locale)
  const password = validatePassword(payload.password, locale)
  const confirmPassword = validatePasswordConfirm(payload.password, payload.confirmPassword, locale)
  if (name) errors.name = name
  if (email) errors.email = email
  if (password) errors.password = password
  if (confirmPassword) errors.confirmPassword = confirmPassword
  return errors
}

export function validateLogin(payload: LoginPayload, locale: string = 'en'): FieldErrors<LoginPayload> {
  const errors: FieldErrors<LoginPayload> = {}
  const email = validateEmail(payload.email, locale)
  const password = payload.password ? null : getMessage(locale, 'auth.validation.passwordRequired')
  if (email) errors.email = email
  if (password) errors.password = password
  return errors
}
