/**
 * Shared DTO types and helpers for the services module.
 */
import type { ServiceDefinitionRow } from '@/lib/db/schema'

/**
 * Safe DTO returned to the client.
 * The client resolves nameKey via getMessage; custom rows use customLabel.
 */
export interface ServiceDefinitionDTO {
  id: string
  icon: string
  nameKey: string | null
  customLabel: string | null
  category: string
  isCustom: boolean
}

export function toServiceDTO(row: ServiceDefinitionRow): ServiceDefinitionDTO {
  return {
    id: row.id,
    icon: row.icon,
    nameKey: row.name_key,
    customLabel: row.custom_label,
    category: row.category,
    isCustom: row.client_id !== null,
  }
}
