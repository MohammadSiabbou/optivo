/**
 * DBClient unit tests.
 *
 * We use Kysely's built-in SQLite dialect (via better-sqlite3 is NOT available,
 * so we use a Kysely DummyDriver + InMemoryDialect pattern) to avoid any real
 * network / AWS calls.  Each test spies on the underlying Kysely instance to
 * verify the correct query is being built and executed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Kysely, DummyDriver, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely'
import { DBClient } from '../DBClient'
import { Pool } from 'pg'

// ---------------------------------------------------------------------------
// Minimal schema for testing
// ---------------------------------------------------------------------------
interface TestUser {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
}

interface TestDB {
  users: TestUser
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a DBClient whose internal Kysely instance uses a DummyDriver so no
 * real DB connection is ever made.  We patch the internal `kysely` property
 * after construction to swap the dialect.
 */
function createTestClient() {
  // We need to bypass pool construction — pass a stub Pool
  const fakePool = {} as Pool
  const client = new DBClient<TestDB>(fakePool)

  // Replace the real Kysely instance (which would try to connect) with one
  // backed by the DummyDriver.  This is intentionally patching the private
  // field for testing purposes only.
  ;(client as unknown as { kysely: Kysely<TestDB> }).kysely = new Kysely<TestDB>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  })

  return client
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DBClient', () => {
  let client: DBClient<TestDB>

  beforeEach(() => {
    client = createTestClient()
  })

  // -------------------------------------------------------------------------
  // insert
  // -------------------------------------------------------------------------
  describe('insert', () => {
    it('builds an INSERT ... RETURNING * query for the correct table', async () => {
      const spy = vi
        .spyOn(client.kysely, 'insertInto')
        .mockReturnValueOnce({
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
            id: 1,
            name: 'Alice',
            email: 'alice@example.com',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          }),
        } as unknown as ReturnType<Kysely<TestDB>['insertInto']>)

      const result = await client.insert('users', { name: 'Alice', email: 'alice@example.com' })

      expect(spy).toHaveBeenCalledWith('users')
      expect(result.name).toBe('Alice')
    })
  })

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('builds an UPDATE ... WHERE ... RETURNING * query', async () => {
      const executeMock = vi.fn().mockResolvedValue([
        { id: 1, name: 'Bob', email: 'bob@example.com', created_at: '', updated_at: '' },
      ])
      const whereMock = vi.fn().mockReturnThis()
      const setMock = vi.fn().mockReturnValue({ where: whereMock, returningAll: vi.fn().mockReturnValue({ execute: executeMock }) })
      const spy = vi
        .spyOn(client.kysely, 'updateTable')
        .mockReturnValueOnce({ set: setMock } as unknown as ReturnType<Kysely<TestDB>['updateTable']>)

      const results = await client.update('users', { id: 1 }, { name: 'Bob' })

      expect(spy).toHaveBeenCalledWith('users')
      expect(setMock).toHaveBeenCalledWith({ name: 'Bob' })
      expect(results[0].name).toBe('Bob')
    })
  })

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    it('builds a DELETE FROM ... WHERE ... RETURNING * query', async () => {
      const executeMock = vi.fn().mockResolvedValue([
        { id: 1, name: 'Carol', email: 'carol@example.com', created_at: '', updated_at: '' },
      ])
      const whereMock = vi.fn().mockReturnValue({ returningAll: vi.fn().mockReturnValue({ execute: executeMock }) })
      const spy = vi
        .spyOn(client.kysely, 'deleteFrom')
        .mockReturnValueOnce({ where: whereMock } as unknown as ReturnType<Kysely<TestDB>['deleteFrom']>)

      const results = await client.delete('users', { id: 1 })

      expect(spy).toHaveBeenCalledWith('users')
      expect(results[0].name).toBe('Carol')
    })
  })

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------
  describe('list', () => {
    it('returns all rows when no filters are provided', async () => {
      const rows: TestUser[] = [
        { id: 1, name: 'Dave', email: 'd@example.com', created_at: '', updated_at: '' },
        { id: 2, name: 'Eve', email: 'e@example.com', created_at: '', updated_at: '' },
      ]
      const executeMock = vi.fn().mockResolvedValue(rows)
      const chainMock = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        execute: executeMock,
      }
      vi.spyOn(client.kysely, 'selectFrom').mockReturnValueOnce(
        chainMock as unknown as ReturnType<Kysely<TestDB>['selectFrom']>,
      )

      const result = await client.list('users')

      expect(result).toHaveLength(2)
      expect(chainMock.where).not.toHaveBeenCalled()
    })

    it('applies filters as WHERE clauses', async () => {
      const executeMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnThis()
      const chainMock = {
        selectAll: vi.fn().mockReturnThis(),
        where: whereMock,
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        execute: executeMock,
      }
      vi.spyOn(client.kysely, 'selectFrom').mockReturnValueOnce(
        chainMock as unknown as ReturnType<Kysely<TestDB>['selectFrom']>,
      )

      await client.list('users', { name: 'Frank' })

      expect(whereMock).toHaveBeenCalledWith('name', '=', 'Frank')
    })

    it('applies limit and offset when provided', async () => {
      const limitMock = vi.fn().mockReturnThis()
      const offsetMock = vi.fn().mockReturnThis()
      const executeMock = vi.fn().mockResolvedValue([])
      const chainMock = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: limitMock,
        offset: offsetMock,
        execute: executeMock,
      }
      vi.spyOn(client.kysely, 'selectFrom').mockReturnValueOnce(
        chainMock as unknown as ReturnType<Kysely<TestDB>['selectFrom']>,
      )

      await client.list('users', undefined, { limit: 10, offset: 20 })

      expect(limitMock).toHaveBeenCalledWith(10)
      expect(offsetMock).toHaveBeenCalledWith(20)
    })
  })

  // -------------------------------------------------------------------------
  // find
  // -------------------------------------------------------------------------
  describe('find', () => {
    it('returns a single row when a match is found', async () => {
      const user: TestUser = { id: 1, name: 'Grace', email: 'g@example.com', created_at: '', updated_at: '' }
      const chainMock = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user),
      }
      vi.spyOn(client.kysely, 'selectFrom').mockReturnValueOnce(
        chainMock as unknown as ReturnType<Kysely<TestDB>['selectFrom']>,
      )

      const result = await client.find('users', { id: 1 })

      expect(result).toEqual(user)
    })

    it('returns null when no row matches', async () => {
      const chainMock = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      }
      vi.spyOn(client.kysely, 'selectFrom').mockReturnValueOnce(
        chainMock as unknown as ReturnType<Kysely<TestDB>['selectFrom']>,
      )

      const result = await client.find('users', { email: 'notfound@example.com' })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // execute
  // -------------------------------------------------------------------------
  describe('execute', () => {
    it('delegates to the query object execute() when compile() is absent', async () => {
      const rows = [{ id: 99, name: 'Test', email: 't@t.com', created_at: '', updated_at: '' }]
      const fakeQuery = {
        execute: vi.fn().mockResolvedValue(rows),
      } as unknown as Parameters<typeof client.execute>[0]

      const result = await client.execute(fakeQuery)

      expect(fakeQuery.execute).toHaveBeenCalled()
      expect(result).toEqual(rows)
    })
  })
})
