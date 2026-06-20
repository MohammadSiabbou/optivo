/**
 * Shared validation rules for client (photographer/studio) auth.
 *
 * These constraints are intentionally plain functions — no library
 * dependencies — so they can be imported on both the frontend (for reactive
 * field-level feedback) and the backend (use-case layer re-validation).
 */

// ---------------------------------------------------------------------------
// Preferred logo dimensions (px)
// ---------------------------------------------------------------------------
export const LOGO_PREFERRED = { minW: 200, maxW: 800, minH: 60, maxH: 240 } as const
export const LOGO_MAX_BYTES = 5 * 1024 * 1024 // 5 MB

// ---------------------------------------------------------------------------
// Field rules
// ---------------------------------------------------------------------------

export function validateName(name: string): string | null {
  if (!name || name.trim().length === 0) return 'Name is required.'
  if (name.trim().length < 2) return 'Name must be at least 2 characters.'
  if (name.trim().length > 120) return 'Name must be 120 characters or fewer.'
  return null
}

export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) return 'Email is required.'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email.trim())) return 'Enter a valid email address.'
  if (email.length > 254) return 'Email is too long.'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (password.length > 72) return 'Password must be 72 characters or fewer.'
  if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  return null
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.'
  if (password !== confirm) return 'Passwords do not match.'
  return null
}

// ---------------------------------------------------------------------------
// Logo dimension warning (non-blocking)
// ---------------------------------------------------------------------------
export function logoSizeWarning(width: number, height: number): string | null {
  const { minW, maxW, minH, maxH } = LOGO_PREFERRED
  if (width < minW || width > maxW || height < minH || height > maxH) {
    return `For the best appearance, use a logo between ${minW}×${minH} px and ${maxW}×${maxH} px. Your image (${width}×${height} px) may not look its best.`
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

export function validateRegister(payload: RegisterPayload): FieldErrors<RegisterPayload> {
  const errors: FieldErrors<RegisterPayload> = {}
  const name = validateName(payload.name)
  const email = validateEmail(payload.email)
  const password = validatePassword(payload.password)
  const confirmPassword = validatePasswordConfirm(payload.password, payload.confirmPassword)
  if (name) errors.name = name
  if (email) errors.email = email
  if (password) errors.password = password
  if (confirmPassword) errors.confirmPassword = confirmPassword
  return errors
}

export function validateLogin(payload: LoginPayload): FieldErrors<LoginPayload> {
  const errors: FieldErrors<LoginPayload> = {}
  const email = validateEmail(payload.email)
  const password = payload.password ? null : 'Password is required.'
  if (email) errors.email = email
  if (password) errors.password = password
  return errors
}
