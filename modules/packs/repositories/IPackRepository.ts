/**
 * Port — every concrete pack repository must implement this interface.
 * Use cases depend only on this contract, never on the implementation.
 */
import type { PackRow } from '@/lib/db/schema'

export interface IPackRepository {
  listForClient(clientId: string): Promise<PackRow[]>
  findById(id: string): Promise<PackRow | null>
  create(
    clientId: string,
    data: {
      name: string
      price: number
      old_price?: number | null
      primary_image_url: string
      image_urls: string[]
      features: string[]
      sort_order?: number
    },
  ): Promise<PackRow>
  update(
    clientId: string,
    id: string,
    data: {
      name?: string
      price?: number
      old_price?: number | null
      primary_image_url?: string | null
      image_urls?: string[]
      features?: string[]
      sort_order?: number
    },
  ): Promise<PackRow>
  delete(clientId: string, id: string): Promise<void>
  reorder(clientId: string, orderedIds: string[]): Promise<void>
}
