/**
 * Kysely database schema types.
 *
 * Each interface maps 1-to-1 to a PostgreSQL table.
 * Add new table types here as the schema grows.
 */

export interface ClientRow {
  id: string
  name: string
  email: string
  /** bcrypt hash — never expose this outside the server layer */
  password: string
  logo_url: string | null
  created_at: Date
  updated_at: Date
}

export interface Database {
  clients: ClientRow
}
