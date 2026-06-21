import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegisterClientUseCase } from '@/modules/clients/usecases/RegisterClientUseCase'
import { LoginClientUseCase } from '@/modules/clients/usecases/LoginClientUseCase'
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'
import type { ClientAuthService } from '@/modules/clients/services/ClientAuthService'
import type { ClientRow } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<ClientRow> = {}): ClientRow {
  return {
    id: 'uuid-1',
    name: 'Test Studio',
    email: 'test@example.com',
    password: 'hashed_pw',
    logo_url: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

function makeRepo(overrides: Partial<IClientRepository> = {}): IClientRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeRow()),
    ...overrides,
  }
}

function makeAuthService(overrides: Partial<ClientAuthService> = {}): ClientAuthService {
  return {
    hash: vi.fn().mockResolvedValue('hashed_pw'),
    verify: vi.fn().mockResolvedValue(true),
    ...overrides,
  } as ClientAuthService
}

// ---------------------------------------------------------------------------
// RegisterClientUseCase
// ---------------------------------------------------------------------------

describe('RegisterClientUseCase', () => {
  let repo: IClientRepository
  let auth: ClientAuthService
  let useCase: RegisterClientUseCase

  beforeEach(() => {
    repo = makeRepo()
    auth = makeAuthService()
    useCase = new RegisterClientUseCase(repo, auth)
  })

  it('successfully registers a new client and returns a safe DTO', async () => {
    const result = await useCase.execute({
      name: 'Test Studio',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    })
    expect(result.id).toBe('uuid-1')
    expect(result).not.toHaveProperty('password')
    expect(repo.create).toHaveBeenCalledOnce()
  })

  it('normalises email to lowercase and trims whitespace', async () => {
    await useCase.execute({
      name: 'Test Studio',
      email: '  TEST@Example.COM  ',
      password: 'Password1',
      confirmPassword: 'Password1',
    })
    const createArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createArg.email).toBe('test@example.com')
  })

  it('throws a validation error when fields are invalid', async () => {
    await expect(
      useCase.execute({ name: '', email: 'bad', password: 'weak', confirmPassword: '' }),
    ).rejects.toThrow('Validation failed')
  })

  it('throws when email already exists', async () => {
    repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(makeRow()) })
    useCase = new RegisterClientUseCase(repo, auth)
    await expect(
      useCase.execute({
        name: 'Test Studio',
        email: 'test@example.com',
        password: 'Password1',
        confirmPassword: 'Password1',
      }),
    ).rejects.toThrow('already exists')
  })

  it('hashes the password before persisting', async () => {
    await useCase.execute({
      name: 'Test Studio',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    })
    expect(auth.hash).toHaveBeenCalledWith('Password1')
    const createArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createArg.password).toBe('hashed_pw')
  })

  it('persists the logo_url when provided', async () => {
    await useCase.execute({
      name: 'Test Studio',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
      logo_url: 'https://blob.example.com/logo.png',
    })
    const createArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createArg.logo_url).toBe('https://blob.example.com/logo.png')
  })
})

// ---------------------------------------------------------------------------
// LoginClientUseCase
// ---------------------------------------------------------------------------

describe('LoginClientUseCase', () => {
  let repo: IClientRepository
  let auth: ClientAuthService
  let useCase: LoginClientUseCase

  beforeEach(() => {
    repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(makeRow()) })
    auth = makeAuthService()
    useCase = new LoginClientUseCase(repo, auth)
  })

  it('returns a safe DTO on successful login', async () => {
    const result = await useCase.execute({ email: 'test@example.com', password: 'Password1' })
    expect(result.id).toBe('uuid-1')
    expect(result).not.toHaveProperty('password')
  })

  it('throws a generic error when email is not found', async () => {
    repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(null) })
    useCase = new LoginClientUseCase(repo, auth)
    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'Password1' }),
    ).rejects.toThrow('Invalid email or password.')
  })

  it('throws a generic error when password is wrong', async () => {
    auth = makeAuthService({ verify: vi.fn().mockResolvedValue(false) })
    useCase = new LoginClientUseCase(repo, auth)
    await expect(
      useCase.execute({ email: 'test@example.com', password: 'WrongPass1' }),
    ).rejects.toThrow('Invalid email or password.')
  })

  it('throws a generic error for invalid payload (no enumeration risk)', async () => {
    await expect(
      useCase.execute({ email: 'not-an-email', password: '' }),
    ).rejects.toThrow('Invalid email or password.')
  })

  it('normalises email to lowercase before lookup', async () => {
    await useCase.execute({ email: 'TEST@EXAMPLE.COM', password: 'Password1' })
    expect(repo.findByEmail).toHaveBeenCalledWith('test@example.com')
  })
})
