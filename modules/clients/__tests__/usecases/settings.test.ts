import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateProfileUseCase } from '@/modules/clients/usecases/UpdateProfileUseCase'
import { UpdateSocialsUseCase } from '@/modules/clients/usecases/UpdateSocialsUseCase'
import { ChangePasswordUseCase } from '@/modules/clients/usecases/ChangePasswordUseCase'
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'
import type { ClientAuthService } from '@/modules/clients/services/ClientAuthService'
import type { ClientRow } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<ClientRow> = {}): ClientRow {
  return {
    id: 'uuid-1',
    name: 'Test Studio',
    email: 'test@example.com',
    password: 'hashed_pw',
    logo_url: null,
    instagram_url: null,
    facebook_url: null,
    linkedin_url: null,
    twitter_url: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

function makeRepo(overrides: Partial<IClientRepository> = {}): IClientRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(makeRow()),
    create: vi.fn().mockResolvedValue(makeRow()),
    update: vi.fn().mockImplementation((_id, data) => Promise.resolve(makeRow(data))),
    ...overrides,
  }
}

function makeAuthService(overrides: Partial<ClientAuthService> = {}): ClientAuthService {
  return {
    hash: vi.fn().mockResolvedValue('new_hashed_pw'),
    verify: vi.fn().mockResolvedValue(true),
    ...overrides,
  } as ClientAuthService
}

// ---------------------------------------------------------------------------
// UpdateProfileUseCase
// ---------------------------------------------------------------------------

describe('UpdateProfileUseCase', () => {
  let repo: IClientRepository
  let useCase: UpdateProfileUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new UpdateProfileUseCase(repo)
  })

  it('calls repo.update with trimmed name and logo_url', async () => {
    const result = await useCase.execute('uuid-1', {
      name: '  Lumière Studio  ',
      logo_url: 'https://blob.example.com/logo.png',
    })
    expect(repo.update).toHaveBeenCalledWith('uuid-1', {
      name: 'Lumière Studio',
      logo_url: 'https://blob.example.com/logo.png',
    })
    expect(result).not.toHaveProperty('password')
  })

  it('sets logo_url to null when not provided', async () => {
    await useCase.execute('uuid-1', { name: 'Studio' })
    const updateArg = (repo.update as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(updateArg.logo_url).toBeNull()
  })

  it('throws a validation error when name is empty', async () => {
    await expect(useCase.execute('uuid-1', { name: '' })).rejects.toThrow('Validation failed')
  })

  it('throws a validation error when name is too short', async () => {
    await expect(useCase.execute('uuid-1', { name: 'X' })).rejects.toThrow('Validation failed')
  })
})

// ---------------------------------------------------------------------------
// UpdateSocialsUseCase
// ---------------------------------------------------------------------------

describe('UpdateSocialsUseCase', () => {
  let repo: IClientRepository
  let useCase: UpdateSocialsUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new UpdateSocialsUseCase(repo)
  })

  it('persists valid URLs', async () => {
    await useCase.execute('uuid-1', {
      instagram_url: 'https://instagram.com/studio',
      facebook_url: 'https://facebook.com/studio',
      linkedin_url: 'https://linkedin.com/in/studio',
      twitter_url: 'https://x.com/studio',
    })
    const arg = (repo.update as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(arg.instagram_url).toBe('https://instagram.com/studio')
    expect(arg.twitter_url).toBe('https://x.com/studio')
  })

  it('normalises empty strings to null', async () => {
    await useCase.execute('uuid-1', {
      instagram_url: '',
      facebook_url: '   ',
    })
    const arg = (repo.update as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(arg.instagram_url).toBeNull()
    expect(arg.facebook_url).toBeNull()
  })

  it('throws a validation error for an invalid URL', async () => {
    await expect(
      useCase.execute('uuid-1', { instagram_url: 'not-a-url' }),
    ).rejects.toThrow('Validation failed')
  })

  it('returns a safe DTO without password', async () => {
    const result = await useCase.execute('uuid-1', {})
    expect(result).not.toHaveProperty('password')
  })
})

// ---------------------------------------------------------------------------
// ChangePasswordUseCase
// ---------------------------------------------------------------------------

describe('ChangePasswordUseCase', () => {
  let repo: IClientRepository
  let auth: ClientAuthService
  let useCase: ChangePasswordUseCase

  beforeEach(() => {
    repo = makeRepo()
    auth = makeAuthService()
    useCase = new ChangePasswordUseCase(repo, auth)
  })

  it('hashes the new password and calls repo.update', async () => {
    await useCase.execute('uuid-1', {
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmNewPassword: 'NewPass1',
    })
    expect(auth.verify).toHaveBeenCalledWith('OldPass1', 'hashed_pw')
    expect(auth.hash).toHaveBeenCalledWith('NewPass1')
    const updateArg = (repo.update as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(updateArg.password).toBe('new_hashed_pw')
  })

  it('throws when currentPassword is wrong', async () => {
    auth = makeAuthService({ verify: vi.fn().mockResolvedValue(false) })
    useCase = new ChangePasswordUseCase(repo, auth)
    await expect(
      useCase.execute('uuid-1', {
        currentPassword: 'WrongPass1',
        newPassword: 'NewPass1',
        confirmNewPassword: 'NewPass1',
      }),
    ).rejects.toThrow('incorrect')
  })

  it('throws a validation error when newPassword is too weak', async () => {
    await expect(
      useCase.execute('uuid-1', {
        currentPassword: 'OldPass1',
        newPassword: 'weak',
        confirmNewPassword: 'weak',
      }),
    ).rejects.toThrow('Validation failed')
  })

  it('throws a validation error when passwords do not match', async () => {
    await expect(
      useCase.execute('uuid-1', {
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmNewPassword: 'DifferentPass1',
      }),
    ).rejects.toThrow('Validation failed')
  })

  it('throws when client is not found', async () => {
    repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) })
    useCase = new ChangePasswordUseCase(repo, auth)
    await expect(
      useCase.execute('uuid-1', {
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmNewPassword: 'NewPass1',
      }),
    ).rejects.toThrow('Client not found')
  })
})
