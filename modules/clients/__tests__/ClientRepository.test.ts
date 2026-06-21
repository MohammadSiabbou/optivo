import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClientRepository } from '@/modules/clients/repositories/ClientRepository'
import type { IDBClient } from '@/lib/db/IDBClient'
import type { Database, ClientRow } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<ClientRow> = {}): ClientRow {
  return {
    id: 'uuid-1',
    name: 'Test Studio',
    email: 'test@example.com',
    password: 'hashed',
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

function makeDB(overrides: Partial<IDBClient<Database>> = {}): IDBClient<Database> {
  return {
    kysely: {} as IDBClient<Database>['kysely'],
    insert: vi.fn().mockResolvedValue(makeRow()),
    update: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue([]),
    list: vi.fn().mockResolvedValue([]),
    find: vi.fn().mockResolvedValue(null),
    execute: vi.fn(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClientRepository', () => {
  let db: IDBClient<Database>
  let repo: ClientRepository

  beforeEach(() => {
    db = makeDB()
    repo = new ClientRepository(db)
  })

  describe('findByEmail', () => {
    it('calls db.find with the clients table and email filter', async () => {
      await repo.findByEmail('test@example.com')
      expect(db.find).toHaveBeenCalledWith('clients', { email: 'test@example.com' })
    })

    it('returns the row when found', async () => {
      db = makeDB({ find: vi.fn().mockResolvedValue(makeRow()) })
      repo = new ClientRepository(db)
      const result = await repo.findByEmail('test@example.com')
      expect(result?.email).toBe('test@example.com')
    })

    it('returns null when not found', async () => {
      const result = await repo.findByEmail('nobody@example.com')
      expect(result).toBeNull()
    })
  })

  describe('findById', () => {
    it('calls db.find with the clients table and id filter', async () => {
      await repo.findById('uuid-1')
      expect(db.find).toHaveBeenCalledWith('clients', { id: 'uuid-1' })
    })
  })

  describe('create', () => {
    it('calls db.insert with all provided fields', async () => {
      const data = {
        name: 'Test Studio',
        email: 'test@example.com',
        password: 'hashed_pw',
        logo_url: 'https://blob.example.com/logo.png',
      }
      await repo.create(data)
      expect(db.insert).toHaveBeenCalledWith('clients', {
        name: data.name,
        email: data.email,
        password: data.password,
        logo_url: data.logo_url,
        instagram_url: null,
        facebook_url: null,
        linkedin_url: null,
        twitter_url: null,
        onboarding_completed_at: null,
      })
    })

    it('defaults logo_url to null when not provided', async () => {
      await repo.create({ name: 'Test', email: 'a@b.com', password: 'hashed' })
      const insertArg = (db.insert as ReturnType<typeof vi.fn>).mock.calls[0][1]
      expect(insertArg.logo_url).toBeNull()
    })

    it('returns the created row', async () => {
      const result = await repo.create({ name: 'Test', email: 'a@b.com', password: 'hashed' })
      expect(result.id).toBe('uuid-1')
    })
  })
})
