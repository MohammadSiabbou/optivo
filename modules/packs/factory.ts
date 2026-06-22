/**
 * Wires up the full dependency graph for the packs module.
 * Called once per request in route handlers.
 */
import { DBClient } from '@/lib/db/DBClient'
import { pool } from '@/lib/db/pool'
import type { Database } from '@/lib/db/schema'
import { PackRepository } from '@/modules/packs/repositories/PackRepository'
import { ListPacksUseCase } from '@/modules/packs/usecases/ListPacksUseCase'
import { CreatePackUseCase } from '@/modules/packs/usecases/CreatePackUseCase'
import { UpdatePackUseCase } from '@/modules/packs/usecases/UpdatePackUseCase'
import { DeletePackUseCase } from '@/modules/packs/usecases/DeletePackUseCase'

export function buildPackDeps() {
  const db = new DBClient<Database>(pool)
  const repo = new PackRepository(db)
  return {
    listPacksUseCase: new ListPacksUseCase(repo),
    createPackUseCase: new CreatePackUseCase(repo),
    updatePackUseCase: new UpdatePackUseCase(repo),
    deletePackUseCase: new DeletePackUseCase(repo),
  }
}
