import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { IServiceRepository } from '@/modules/services/repositories/IServiceRepository'
import { GetServiceCatalogUseCase } from '@/modules/services/usecases/GetServiceCatalogUseCase'
import { SaveServiceSelectionUseCase } from '@/modules/services/usecases/SaveServiceSelectionUseCase'
import { AddCustomServiceUseCase } from '@/modules/services/usecases/AddCustomServiceUseCase'
import { DeleteCustomServiceUseCase } from '@/modules/services/usecases/DeleteCustomServiceUseCase'
import type { ServiceDefinitionRow } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDefinitionRow(overrides: Partial<ServiceDefinitionRow> = {}): ServiceDefinitionRow {
  return {
    id: 'def-uuid-1',
    client_id: null,
    category: 'photo',
    icon: 'Camera',
    name_key: 'services.catalog.studioPhotography',
    custom_label: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

function makeRepo(overrides: Partial<IServiceRepository> = {}): IServiceRepository {
  return {
    listDefaults: vi.fn().mockResolvedValue([makeDefinitionRow()]),
    listCustomForClient: vi.fn().mockResolvedValue([]),
    createCustomDefinition: vi.fn().mockResolvedValue(
      makeDefinitionRow({ id: 'custom-1', client_id: 'client-1', custom_label: 'Boudoir', name_key: null }),
    ),
    listSelectedForClient: vi.fn().mockResolvedValue([makeDefinitionRow()]),
    setSelections: vi.fn().mockResolvedValue(undefined),
    deleteCustomDefinition: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// GetServiceCatalogUseCase
// ---------------------------------------------------------------------------

describe('GetServiceCatalogUseCase', () => {
  it('returns defaults, custom, and selectedIds', async () => {
    const repo = makeRepo()
    const useCase = new GetServiceCatalogUseCase(repo)
    const result = await useCase.execute('client-1', 'photo')

    expect(repo.listDefaults).toHaveBeenCalledWith('photo')
    expect(repo.listCustomForClient).toHaveBeenCalledWith('client-1', 'photo')
    expect(repo.listSelectedForClient).toHaveBeenCalledWith('client-1', 'photo')

    expect(result.defaults).toHaveLength(1)
    expect(result.defaults[0].isCustom).toBe(false)
    expect(result.selectedIds).toContain('def-uuid-1')
  })
})

// ---------------------------------------------------------------------------
// SaveServiceSelectionUseCase
// ---------------------------------------------------------------------------

describe('SaveServiceSelectionUseCase', () => {
  let repo: IServiceRepository
  let useCase: SaveServiceSelectionUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new SaveServiceSelectionUseCase(repo)
  })

  it('creates custom definitions and includes their ids in setSelections', async () => {
    await useCase.execute('client-1', {
      category: 'photo',
      definitionIds: ['def-1'],
      customServices: [{ label: 'Boudoir', icon: 'Heart' }],
    })

    expect(repo.createCustomDefinition).toHaveBeenCalledWith('client-1', {
      icon: 'Heart',
      label: 'Boudoir',
      category: 'photo',
    })

    const setArg = (repo.setSelections as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(setArg[0]).toBe('client-1')
    expect(setArg[1]).toBe('photo')
    // definitionIds + new custom id
    expect(setArg[2]).toContain('def-1')
    expect(setArg[2]).toContain('custom-1')
  })

  it('throws a validation error for an invalid category', async () => {
    await expect(
      useCase.execute('client-1', {
        category: 'music' as any,
        definitionIds: [],
        customServices: [],
      }),
    ).rejects.toThrow('Validation failed')
  })

  it('calls setSelections with an empty array when nothing is selected', async () => {
    await useCase.execute('client-1', {
      category: 'video',
      definitionIds: [],
      customServices: [],
    })

    expect(repo.setSelections).toHaveBeenCalledWith('client-1', 'video', [])
  })
})

// ---------------------------------------------------------------------------
// AddCustomServiceUseCase
// ---------------------------------------------------------------------------

describe('AddCustomServiceUseCase', () => {
  it('creates and returns a service DTO', async () => {
    const repo = makeRepo()
    const useCase = new AddCustomServiceUseCase(repo)
    const result = await useCase.execute('client-1', {
      label: 'Boudoir',
      category: 'photo',
    })

    expect(repo.createCustomDefinition).toHaveBeenCalled()
    expect(result.isCustom).toBe(true)
    expect(result.customLabel).toBe('Boudoir')
  })

  it('throws for an invalid label', async () => {
    const repo = makeRepo()
    const useCase = new AddCustomServiceUseCase(repo)
    await expect(
      useCase.execute('client-1', { label: '', category: 'photo' }),
    ).rejects.toThrow('Validation failed')
  })

  it('throws for an invalid category', async () => {
    const repo = makeRepo()
    const useCase = new AddCustomServiceUseCase(repo)
    await expect(
      useCase.execute('client-1', { label: 'Test', category: 'music' }),
    ).rejects.toThrow('Validation failed')
  })
})

// ---------------------------------------------------------------------------
// DeleteCustomServiceUseCase
// ---------------------------------------------------------------------------

describe('DeleteCustomServiceUseCase', () => {
  it('calls repo.deleteCustomDefinition with correct args', async () => {
    const repo = makeRepo()
    const useCase = new DeleteCustomServiceUseCase(repo)
    await useCase.execute('client-1', 'def-uuid-1')

    expect(repo.deleteCustomDefinition).toHaveBeenCalledWith('client-1', 'def-uuid-1')
  })
})
