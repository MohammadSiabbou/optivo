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

// ---------------------------------------------------------------------------
// Settings payloads
// ---------------------------------------------------------------------------

export interface UpdateProfilePayload {
  name: string
  logo_url?: string | null
}

export interface UpdateSocialsPayload {
  instagram_url?: string
  facebook_url?: string
  linkedin_url?: string
  twitter_url?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

function validateUrl(raw: string | undefined, locale: string): string | null {
  if (!raw || raw.trim() === '') return null // empty / absent is fine
  try {
    const parsed = new URL(raw.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return getMessage(locale, 'settings.validation.urlInvalid')
    }
  } catch {
    return getMessage(locale, 'settings.validation.urlInvalid')
  }
  return null
}

export function validateUpdateProfile(payload: UpdateProfilePayload, locale: string = 'en'): FieldErrors<UpdateProfilePayload> {
  const errors: FieldErrors<UpdateProfilePayload> = {}
  const name = validateName(payload.name, locale)
  if (name) errors.name = name
  return errors
}

export function validateUpdateSocials(payload: UpdateSocialsPayload, locale: string = 'en'): FieldErrors<UpdateSocialsPayload> {
  const errors: FieldErrors<UpdateSocialsPayload> = {}
  const instagram = validateUrl(payload.instagram_url, locale)
  const facebook = validateUrl(payload.facebook_url, locale)
  const linkedin = validateUrl(payload.linkedin_url, locale)
  const twitter = validateUrl(payload.twitter_url, locale)
  if (instagram) errors.instagram_url = instagram
  if (facebook) errors.facebook_url = facebook
  if (linkedin) errors.linkedin_url = linkedin
  if (twitter) errors.twitter_url = twitter
  return errors
}

export function validateChangePassword(payload: ChangePasswordPayload, locale: string = 'en'): FieldErrors<ChangePasswordPayload> {
  const errors: FieldErrors<ChangePasswordPayload> = {}
  if (!payload.currentPassword) {
    errors.currentPassword = getMessage(locale, 'settings.validation.currentPasswordRequired')
  }
  const newPw = validatePassword(payload.newPassword, locale)
  if (newPw) errors.newPassword = newPw
  const confirm = validatePasswordConfirm(payload.newPassword, payload.confirmNewPassword, locale)
  if (confirm) errors.confirmNewPassword = confirm
  return errors
}
