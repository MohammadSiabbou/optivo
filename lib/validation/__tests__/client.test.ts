import { describe, it, expect } from 'vitest'
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  logoSizeWarning,
  validateRegister,
  validateLogin,
  LOGO_PREFERRED,
} from '../client'

// ---------------------------------------------------------------------------
// validateName
// ---------------------------------------------------------------------------
describe('validateName', () => {
  it('returns null for a valid name', () => {
    expect(validateName('Lumière Studio')).toBeNull()
  })
  it('errors when empty', () => {
    expect(validateName('')).not.toBeNull()
    expect(validateName('   ')).not.toBeNull()
  })
  it('errors when too short', () => {
    expect(validateName('A')).not.toBeNull()
  })
  it('errors when too long', () => {
    expect(validateName('A'.repeat(121))).not.toBeNull()
  })
  it('accepts minimum valid length', () => {
    expect(validateName('AB')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------
describe('validateEmail', () => {
  it('returns null for a valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull()
  })
  it('errors when empty', () => {
    expect(validateEmail('')).not.toBeNull()
  })
  it('errors for missing @', () => {
    expect(validateEmail('notanemail')).not.toBeNull()
  })
  it('errors for missing domain', () => {
    expect(validateEmail('user@')).not.toBeNull()
  })
  it('errors when too long', () => {
    expect(validateEmail('a'.repeat(250) + '@b.com')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validatePassword
// ---------------------------------------------------------------------------
describe('validatePassword', () => {
  it('returns null for a strong password', () => {
    expect(validatePassword('Secret123')).toBeNull()
  })
  it('errors when empty', () => {
    expect(validatePassword('')).not.toBeNull()
  })
  it('errors when too short', () => {
    expect(validatePassword('Ab1')).not.toBeNull()
  })
  it('errors when missing a letter', () => {
    expect(validatePassword('12345678')).not.toBeNull()
  })
  it('errors when missing a number', () => {
    expect(validatePassword('abcdefgh')).not.toBeNull()
  })
  it('errors when too long', () => {
    expect(validatePassword('A1' + 'a'.repeat(71))).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validatePasswordConfirm
// ---------------------------------------------------------------------------
describe('validatePasswordConfirm', () => {
  it('returns null when passwords match', () => {
    expect(validatePasswordConfirm('Secret123', 'Secret123')).toBeNull()
  })
  it('errors when confirmation is empty', () => {
    expect(validatePasswordConfirm('Secret123', '')).not.toBeNull()
  })
  it('errors when passwords do not match', () => {
    expect(validatePasswordConfirm('Secret123', 'Different1')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// logoSizeWarning
// ---------------------------------------------------------------------------
describe('logoSizeWarning', () => {
  const { minW, maxW, minH, maxH } = LOGO_PREFERRED

  it('returns null for dimensions within preferred range', () => {
    expect(logoSizeWarning(400, 120)).toBeNull()
  })
  it('returns null at exact boundary values', () => {
    expect(logoSizeWarning(minW, minH)).toBeNull()
    expect(logoSizeWarning(maxW, maxH)).toBeNull()
  })
  it('returns a warning string when width is too small', () => {
    expect(logoSizeWarning(minW - 1, 120)).not.toBeNull()
  })
  it('returns a warning string when height is too large', () => {
    expect(logoSizeWarning(400, maxH + 1)).not.toBeNull()
  })
  it('includes actual dimensions in the warning message', () => {
    const msg = logoSizeWarning(50, 10)
    expect(msg).toContain('50×10')
  })
})

// ---------------------------------------------------------------------------
// validateRegister (aggregate)
// ---------------------------------------------------------------------------
describe('validateRegister', () => {
  const valid = {
    name: 'Test Studio',
    email: 'test@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  }

  it('returns empty errors for a valid payload', () => {
    expect(Object.keys(validateRegister(valid))).toHaveLength(0)
  })

  it('collects all field errors at once', () => {
    const errors = validateRegister({ name: '', email: 'bad', password: 'weak', confirmPassword: '' })
    expect(errors.name).toBeDefined()
    expect(errors.email).toBeDefined()
    expect(errors.password).toBeDefined()
    expect(errors.confirmPassword).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// validateLogin (aggregate)
// ---------------------------------------------------------------------------
describe('validateLogin', () => {
  it('returns empty errors for a valid payload', () => {
    expect(Object.keys(validateLogin({ email: 'test@example.com', password: 'anything' }))).toHaveLength(0)
  })
  it('errors on missing email', () => {
    const errors = validateLogin({ email: '', password: 'anything' })
    expect(errors.email).toBeDefined()
  })
  it('errors on missing password', () => {
    const errors = validateLogin({ email: 'test@example.com', password: '' })
    expect(errors.password).toBeDefined()
  })
})
