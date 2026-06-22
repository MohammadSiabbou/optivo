/**
 * Wires up the full dependency graph for the services module.
 * Called once per request in route handlers.
 */
import { DBClient } from '@/lib/db/DBClient'
import { pool } from '@/lib/db/pool'
import type { Database } from '@/lib/db/schema'
import { ServiceRepository } from '@/modules/services/repositories/ServiceRepository'
import { GetServiceCatalogUseCase } from '@/modules/services/usecases/GetServiceCatalogUseCase'
import { SaveServiceSelectionUseCase } from '@/modules/services/usecases/SaveServiceSelectionUseCase'
import { AddCustomServiceUseCase } from '@/modules/services/usecases/AddCustomServiceUseCase'
import { DeleteCustomServiceUseCase } from '@/modules/services/usecases/DeleteCustomServiceUseCase'

export function buildServiceDeps() {
  const db = new DBClient<Database>(pool)
  const repo = new ServiceRepository(db)
  return {
    getServiceCatalogUseCase: new GetServiceCatalogUseCase(repo),
    saveServiceSelectionUseCase: new SaveServiceSelectionUseCase(repo),
    addCustomServiceUseCase: new AddCustomServiceUseCase(repo),
    deleteCustomServiceUseCase: new DeleteCustomServiceUseCase(repo),
  }
}
