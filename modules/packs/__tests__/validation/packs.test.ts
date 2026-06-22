import { describe, it, expect } from 'vitest'
import {
  validatePackName,
  validatePrice,
  validateOldPrice,
  validateFeatures,
  validateImages,
  validateCreatePack,
  PACK_MAX_FEATURES,
  PACK_MAX_IMAGES,
} from '@/modules/packs/validation'

describe('validatePackName', () => {
  it('returns null for a valid name', () => {
    expect(validatePackName('Gold Pack')).toBeNull()
  })

  it('returns an error for an empty name', () => {
    expect(validatePackName('')).toBeTruthy()
    expect(validatePackName('  ')).toBeTruthy()
  })

  it('returns an error for a name that is too short', () => {
    expect(validatePackName('X')).toBeTruthy()
  })

  it('returns an error for a name over 120 chars', () => {
    expect(validatePackName('A'.repeat(121))).toBeTruthy()
  })

  it('accepts a name at exactly 2 characters', () => {
    expect(validatePackName('AB')).toBeNull()
  })
})

describe('validatePrice', () => {
  it('returns null for 0', () => {
    expect(validatePrice(0)).toBeNull()
  })

  it('returns null for a positive number', () => {
    expect(validatePrice(299.99)).toBeNull()
  })

  it('returns an error for empty / null / undefined', () => {
    expect(validatePrice('')).toBeTruthy()
    expect(validatePrice(null)).toBeTruthy()
    expect(validatePrice(undefined)).toBeTruthy()
  })

  it('returns an error for a negative price', () => {
    expect(validatePrice(-1)).toBeTruthy()
  })

  it('returns an error for NaN', () => {
    expect(validatePrice('abc')).toBeTruthy()
  })
})

describe('validateOldPrice', () => {
  it('returns null when old_price is absent', () => {
    expect(validateOldPrice(null, 100)).toBeNull()
    expect(validateOldPrice(undefined, 100)).toBeNull()
    expect(validateOldPrice('', 100)).toBeNull()
  })

  it('returns null for a valid old price', () => {
    expect(validateOldPrice(399, 299)).toBeNull()
  })

  it('returns an error for a negative old price', () => {
    expect(validateOldPrice(-10, 100)).toBeTruthy()
  })
})

describe('validateFeatures', () => {
  it('returns null for an empty array', () => {
    expect(validateFeatures([])).toBeNull()
  })

  it('returns null for valid feature lines', () => {
    expect(validateFeatures(['2 hours', '10 edited photos'])).toBeNull()
  })

  it(`returns an error for more than ${PACK_MAX_FEATURES} features`, () => {
    const lines = Array.from({ length: PACK_MAX_FEATURES + 1 }, (_, i) => `Feature ${i}`)
    expect(validateFeatures(lines)).toBeTruthy()
  })

  it('returns an error for a feature line over 120 chars', () => {
    expect(validateFeatures(['A'.repeat(121)])).toBeTruthy()
  })
})

describe('validateImages', () => {
  it('returns null when primary and images are valid', () => {
    expect(validateImages('https://example.com/img.jpg', [])).toBeNull()
  })

  it('returns an error when primary is missing', () => {
    expect(validateImages(null, [])).toBeTruthy()
    expect(validateImages('', [])).toBeTruthy()
  })

  it(`returns an error when total images exceed ${PACK_MAX_IMAGES}`, () => {
    const extras = Array.from({ length: PACK_MAX_IMAGES }, (_, i) => `https://example.com/${i}.jpg`)
    expect(validateImages('https://example.com/primary.jpg', extras)).toBeTruthy()
  })
})

describe('validateCreatePack', () => {
  it('returns no errors for a valid payload', () => {
    const errors = validateCreatePack({
      name: 'Gold Pack',
      price: 299,
      primary_image_url: 'https://example.com/img.jpg',
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('returns errors when required fields are missing', () => {
    const errors = validateCreatePack({
      name: '',
      price: 0,
      primary_image_url: '',
    })
    expect(errors.name).toBeTruthy()
    expect(errors.primary_image_url).toBeTruthy()
  })
})
