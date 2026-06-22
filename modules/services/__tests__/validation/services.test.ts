import { describe, it, expect } from 'vitest'
import {
  validateCustomServiceLabel,
  validateCategory,
  validateServiceSelection,
  SERVICE_CATEGORIES,
} from '@/modules/services/validation'

describe('validateCustomServiceLabel', () => {
  it('returns null for a valid label', () => {
    expect(validateCustomServiceLabel('Boudoir Photography')).toBeNull()
  })

  it('returns an error for an empty label', () => {
    expect(validateCustomServiceLabel('')).toBeTruthy()
    expect(validateCustomServiceLabel('  ')).toBeTruthy()
  })

  it('returns an error for a label that is too short', () => {
    expect(validateCustomServiceLabel('X')).toBeTruthy()
  })

  it('returns an error for a label that exceeds 80 chars', () => {
    expect(validateCustomServiceLabel('A'.repeat(81))).toBeTruthy()
  })

  it('accepts a label at exactly 2 characters', () => {
    expect(validateCustomServiceLabel('AB')).toBeNull()
  })

  it('accepts a label at exactly 80 characters', () => {
    expect(validateCustomServiceLabel('A'.repeat(80))).toBeNull()
  })
})

describe('validateCategory', () => {
  it('returns null for photo', () => {
    expect(validateCategory('photo')).toBeNull()
  })

  it('returns null for video', () => {
    expect(validateCategory('video')).toBeNull()
  })

  it('returns an error for an invalid category', () => {
    expect(validateCategory('audio')).toBeTruthy()
    expect(validateCategory('')).toBeTruthy()
  })

  it('covers all SERVICE_CATEGORIES constants', () => {
    for (const cat of SERVICE_CATEGORIES) {
      expect(validateCategory(cat)).toBeNull()
    }
  })
})

describe('validateServiceSelection', () => {
  it('returns no errors for a valid payload', () => {
    const errors = validateServiceSelection({
      category: 'photo',
      definitionIds: ['id-1', 'id-2'],
      customServices: [{ label: 'Boudoir', icon: 'Heart' }],
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('returns an error for an invalid category', () => {
    const errors = validateServiceSelection({
      category: 'music' as any,
      definitionIds: [],
      customServices: [],
    })
    expect(errors.category).toBeTruthy()
  })

  it('returns an error when a custom label is invalid', () => {
    const errors = validateServiceSelection({
      category: 'video',
      definitionIds: [],
      customServices: [{ label: '' }],
    })
    expect(errors.customServices).toBeTruthy()
  })
})
