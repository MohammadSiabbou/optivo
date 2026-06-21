import { describe, it, expect, vi } from 'vitest'
import { CompleteOnboardingUseCase } from '@/modules/clients/usecases/CompleteOnboardingUseCase'
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'
import type { ClientRow } from '@/lib/db/schema'

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
    onboarding_completed_at: null,
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

describe('CompleteOnboardingUseCase', () => {
  it('calls repo.update with a Date for onboarding_completed_at', async () => {
    const repo = makeRepo()
    const useCase = new CompleteOnboardingUseCase(repo)

    await useCase.execute('uuid-1')

    expect(repo.update).toHaveBeenCalledWith(
      'uuid-1',
      expect.objectContaining({
        onboarding_completed_at: expect.any(Date),
      }),
    )
  })
})
