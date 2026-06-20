import type {
  Compilable,
  InferResult,
  Kysely,
  OrderByExpression,
  StringReference,
} from 'kysely'

/**
 * A filter map where keys are column names of T and values are the expected
 * column value.  All provided entries are combined with AND.
 */
export type FilterMap<T> = Partial<{ [K in keyof T]: T[K] }>

/**
 * Port – every concrete DB client must implement this interface.
 *
 * Generic parameter DB is the full Kysely database schema type so callers
 * get compile-time table / column checking.
 */
export interface IDBClient<DB> {
  /**
   * Expose the underlying Kysely instance for services that need to build
   * complex queries themselves before handing them back to `execute`.
   */
  readonly kysely: Kysely<DB>

  /**
   * Insert a single row into `table` and return the inserted row.
   */
  insert<T extends keyof DB & string>(
    table: T,
    values: Omit<DB[T], 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>,
  ): Promise<DB[T]>

  /**
   * Update rows in `table` matching `filters` with `values`.
   * Returns all updated rows.
   */
  update<T extends keyof DB & string>(
    table: T,
    filters: FilterMap<DB[T]>,
    values: Partial<DB[T]>,
  ): Promise<DB[T][]>

  /**
   * Delete rows in `table` matching `filters`.
   * Returns the deleted rows.
   */
  delete<T extends keyof DB & string>(
    table: T,
    filters: FilterMap<DB[T]>,
  ): Promise<DB[T][]>

  /**
   * Return all rows from `table` matching optional `filters`.
   * Supports pagination via `limit` / `offset` and a single `orderBy` column.
   */
  list<T extends keyof DB & string>(
    table: T,
    filters?: FilterMap<DB[T]>,
    options?: {
      limit?: number
      offset?: number
      orderBy?: StringReference<DB, T>
      orderDir?: 'asc' | 'desc'
    },
  ): Promise<DB[T][]>

  /**
   * Return the first row from `table` matching `filters`, or `null` if none.
   */
  find<T extends keyof DB & string>(
    table: T,
    filters: FilterMap<DB[T]>,
  ): Promise<DB[T] | null>

  /**
   * Execute a pre-built Kysely compilable query (SelectQueryBuilder,
   * InsertQueryBuilder, etc.).  Use only when `insert` / `update` / `delete` /
   * `list` / `find` cannot express the required query.
   *
   * Kysely's parameterised binding prevents SQL injection.
   */
  execute<Q extends Compilable>(query: Q): Promise<InferResult<Q>>
}
