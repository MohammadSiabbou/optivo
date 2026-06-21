import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { IPackRepository } from '@/modules/packs/repositories/IPackRepository'
import { ListPacksUseCase } from '@/modules/packs/usecases/ListPacksUseCase'
import { CreatePackUseCase } from '@/modules/packs/usecases/CreatePackUseCase'
import { UpdatePackUseCase } from '@/modules/packs/usecases/UpdatePackUseCase'
import { DeletePackUseCase } from '@/modules/packs/usecases/DeletePackUseCase'
import type { PackRow } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePackRow(overrides: Partial<PackRow> = {}): PackRow {
  return {
    id: 'pack-uuid-1',
    client_id: 'client-1',
    name: 'Gold Pack',
    price: '299.00',
    old_price: null,
    primary_image_url: 'https://example.com/img.jpg',
    image_urls: [],
    features: ['2 hours', '10 edited photos'],
    sort_order: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

function makeRepo(overrides: Partial<IPackRepository> = {}): IPackRepository {
  return {
    listForClient: vi.fn().mockResolvedValue([makePackRow()]),
    findById: vi.fn().mockResolvedValue(makePackRow()),
    create: vi.fn().mockImplementation((_clientId, data) =>
      Promise.resolve(
        makePackRow({
          name: data.name,
          price: String(data.price),
          features: data.features,
        }),
      ),
    ),
    update: vi.fn().mockImplementation((_clientId, _id, data) =>
      Promise.resolve(makePackRow(data as Partial<PackRow>)),
    ),
    delete: vi.fn().mockResolvedValue(undefined),
    reorder: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// ListPacksUseCase
// ---------------------------------------------------------------------------

describe('ListPacksUseCase', () => {
  it('returns PackDTOs with numeric prices', async () => {
    const repo = makeRepo()
    const useCase = new ListPacksUseCase(repo)
    const result = await useCase.execute('client-1')

    expect(repo.listForClient).toHaveBeenCalledWith('client-1')
    expect(result[0].price).toBe(299)
    expect(typeof result[0].price).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// CreatePackUseCase
// ---------------------------------------------------------------------------

describe('CreatePackUseCase', () => {
  let repo: IPackRepository
  let useCase: CreatePackUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new CreatePackUseCase(repo)
  })

  it('creates a pack and returns a DTO', async () => {
    const result = await useCase.execute('client-1', {
      name: 'Silver Pack',
      price: 199,
      primary_image_url: 'https://example.com/img.jpg',
      features: ['1 hour', '5 edited photos'],
    })
    expect(repo.create).toHaveBeenCalledWith('client-1', expect.objectContaining({ name: 'Silver Pack' }))
    expect(result.name).toBe('Silver Pack')
  })

  it('throws a validation error when name is empty', async () => {
    await expect(
      useCase.execute('client-1', {
        name: '',
        price: 100,
        primary_image_url: 'https://example.com/img.jpg',
      }),
    ).rejects.toThrow('Validation failed')
  })

  it('throws a validation error when primary image is missing', async () => {
    await expect(
      useCase.execute('client-1', {
        name: 'Pack',
        price: 100,
        primary_image_url: '',
      }),
    ).rejects.toThrow('Validation failed')
  })
})

// ---------------------------------------------------------------------------
// UpdatePackUseCase
// ---------------------------------------------------------------------------

describe('UpdatePackUseCase', () => {
  let repo: IPackRepository
  let useCase: UpdatePackUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new UpdatePackUseCase(repo)
  })

  it('updates and returns a DTO', async () => {
    const result = await useCase.execute('client-1', 'pack-uuid-1', { name: 'Platinum Pack' })
    expect(repo.update).toHaveBeenCalledWith(
      'client-1',
      'pack-uuid-1',
      expect.objectContaining({ name: 'Platinum Pack' }),
    )
    expect(result).toBeDefined()
  })

  it('throws a validation error for an invalid name', async () => {
    await expect(
      useCase.execute('client-1', 'pack-uuid-1', { name: 'X' }),
    ).rejects.toThrow('Validation failed')
  })
})

// ---------------------------------------------------------------------------
// DeletePackUseCase
// ---------------------------------------------------------------------------

describe('DeletePackUseCase', () => {
  it('calls repo.delete with correct args', async () => {
    const repo = makeRepo()
    const useCase = new DeletePackUseCase(repo)
    await useCase.execute('client-1', 'pack-uuid-1')
    expect(repo.delete).toHaveBeenCalledWith('client-1', 'pack-uuid-1')
  })
})
