/**
 * Shared DTO types for the packs module.
 *
 * price / old_price are exposed as numbers in DTOs; DB stores them as strings
 * (NUMERIC → string via pg). Conversion happens here.
 */
import type { PackRow } from '@/lib/db/schema'

export interface PackDTO {
  id: string
  name: string
  price: number
  oldPrice: number | null
  primaryImageUrl: string | null
  imageUrls: string[]
  features: string[]
  sortOrder: number
}

export function toPackDTO(row: PackRow): PackDTO {
  return {
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    oldPrice: row.old_price !== null ? parseFloat(row.old_price) : null,
    primaryImageUrl: row.primary_image_url,
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : JSON.parse(row.image_urls as unknown as string),
    features: Array.isArray(row.features) ? row.features : JSON.parse(row.features as unknown as string),
    sortOrder: row.sort_order,
  }
}
