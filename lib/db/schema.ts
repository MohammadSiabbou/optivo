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
  instagram_url: string | null
  facebook_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  onboarding_completed_at: Date | null
  created_at: Date
  updated_at: Date
}

/**
 * A service definition row.
 * client_id = NULL means a system default shared across all studios.
 * Exactly one of name_key / custom_label is set (enforced at app layer).
 */
export interface ServiceDefinitionRow {
  id: string
  client_id: string | null
  category: string
  icon: string
  name_key: string | null
  custom_label: string | null
  created_at: Date
  updated_at: Date
}

/**
 * The join table recording which service definitions a studio offers.
 */
export interface ClientServiceRow {
  id: string
  client_id: string
  service_definition_id: string
  created_at: Date
}

/**
 * A pack row.
 * image_urls and features are stored as JSONB arrays in the DB but
 * pg returns them as JS arrays after JSON parsing.
 * price / old_price are returned as strings by pg (NUMERIC type).
 */
export interface PackRow {
  id: string
  client_id: string
  name: string
  price: string
  old_price: string | null
  primary_image_url: string | null
  image_urls: string[]
  features: string[]
  sort_order: number
  created_at: Date
  updated_at: Date
}

export interface Database {
  clients: ClientRow
  service_definitions: ServiceDefinitionRow
  client_services: ClientServiceRow
  packs: PackRow
}
