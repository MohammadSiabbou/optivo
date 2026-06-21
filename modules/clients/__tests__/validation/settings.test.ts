import { describe, it, expect } from 'vitest'
import {
  validateUpdateProfile,
  validateUpdateSocials,
  validateChangePassword,
} from '@/modules/clients/validation'

// ---------------------------------------------------------------------------
// validateUpdateProfile
// ---------------------------------------------------------------------------

describe('validateUpdateProfile', () => {
  it('returns no errors for a valid name', () => {
    expect(validateUpdateProfile({ name: 'Lumière Studio' })).toEqual({})
  })

  it('returns an error when name is empty', () => {
    const errors = validateUpdateProfile({ name: '' })
    expect(errors.name).toBeTruthy()
  })

  it('returns an error when name is too short', () => {
    const errors = validateUpdateProfile({ name: 'X' })
    expect(errors.name).toBeTruthy()
  })

  it('accepts an optional logo_url without error', () => {
    expect(
      validateUpdateProfile({ name: 'Studio', logo_url: 'https://blob.example.com/logo.png' }),
    ).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// validateUpdateSocials
// ---------------------------------------------------------------------------

describe('validateUpdateSocials', () => {
  it('returns no errors when all fields are omitted', () => {
    expect(validateUpdateSocials({})).toEqual({})
  })

  it('returns no errors when all fields are empty strings', () => {
    expect(
      validateUpdateSocials({
        instagram_url: '',
        facebook_url: '',
        linkedin_url: '',
        twitter_url: '',
      }),
    ).toEqual({})
  })

  it('returns no errors for valid https URLs', () => {
    expect(
      validateUpdateSocials({
        instagram_url: 'https://instagram.com/studio',
        facebook_url: 'https://facebook.com/studio',
        linkedin_url: 'https://linkedin.com/in/studio',
        twitter_url: 'https://x.com/studio',
      }),
    ).toEqual({})
  })

  it('returns an error for a non-URL string', () => {
    const errors = validateUpdateSocials({ instagram_url: 'not-a-url' })
    expect(errors.instagram_url).toBeTruthy()
  })

  it('returns an error for a URL with unsupported protocol (ftp)', () => {
    const errors = validateUpdateSocials({ twitter_url: 'ftp://example.com' })
    expect(errors.twitter_url).toBeTruthy()
  })

  it('returns errors only for invalid fields, not for valid ones', () => {
    const errors = validateUpdateSocials({
      instagram_url: 'https://instagram.com/studio',
      facebook_url: 'definitely not a url',
    })
    expect(errors.instagram_url).toBeUndefined()
    expect(errors.facebook_url).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// validateChangePassword
// ---------------------------------------------------------------------------

describe('validateChangePassword', () => {
  it('returns no errors for a valid payload', () => {
    expect(
      validateChangePassword({
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmNewPassword: 'NewPass1',
      }),
    ).toEqual({})
  })

  it('returns an error when currentPassword is empty', () => {
    const errors = validateChangePassword({
      currentPassword: '',
      newPassword: 'NewPass1',
      confirmNewPassword: 'NewPass1',
    })
    expect(errors.currentPassword).toBeTruthy()
  })

  it('returns an error when newPassword is too weak', () => {
    const errors = validateChangePassword({
      currentPassword: 'OldPass1',
      newPassword: 'weak',
      confirmNewPassword: 'weak',
    })
    expect(errors.newPassword).toBeTruthy()
  })

  it('returns an error when passwords do not match', () => {
    const errors = validateChangePassword({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmNewPassword: 'DifferentPass1',
    })
    expect(errors.confirmNewPassword).toBeTruthy()
  })

  it('returns an error when newPassword has no digit', () => {
    const errors = validateChangePassword({
      currentPassword: 'OldPass1',
      newPassword: 'NoDigitsHere',
      confirmNewPassword: 'NoDigitsHere',
    })
    expect(errors.newPassword).toBeTruthy()
  })
})
