/**
 * Port — every concrete service repository must implement this interface.
 * Use cases depend only on this contract, never on the implementation.
 */
import type { ServiceDefinitionRow } from '@/lib/db/schema'

export interface IServiceRepository {
  /** All system defaults (client_id IS NULL), optionally filtered by category. */
  listDefaults(category?: string): Promise<ServiceDefinitionRow[]>

  /** Custom definitions belonging to a specific studio, optionally filtered by category. */
  listCustomForClient(clientId: string, category?: string): Promise<ServiceDefinitionRow[]>

  /** Create a new custom definition scoped to a studio. */
  createCustomDefinition(
    clientId: string,
    data: { icon: string; label: string; category: string },
  ): Promise<ServiceDefinitionRow>

  /**
   * Return the service definitions that a studio has selected,
   * optionally filtered by category.
   */
  listSelectedForClient(clientId: string, category?: string): Promise<ServiceDefinitionRow[]>

  /**
   * Replace a studio's selections for a given category atomically
   * (delete-then-insert within a single transaction).
   */
  setSelections(
    clientId: string,
    category: string,
    definitionIds: string[],
  ): Promise<void>

  /**
   * Delete a custom definition.
   * Scoped by client_id so a studio cannot delete defaults or another studio's rows.
   */
  deleteCustomDefinition(clientId: string, definitionId: string): Promise<void>
}
