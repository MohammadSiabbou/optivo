/**
 * Wires up the full dependency graph for client auth use cases.
 * Called once per request in Route Handlers.
 */
import { DBClient } from '@/lib/db/DBClient'
import { pool } from '@/lib/db/pool'
import type { Database } from '@/lib/db/schema'
import { ClientRepository } from '@/modules/clients/repositories/ClientRepository'
import { ClientAuthService } from '@/modules/clients/services/ClientAuthService'
import { RegisterClientUseCase } from '@/modules/clients/usecases/RegisterClientUseCase'
import { LoginClientUseCase } from '@/modules/clients/usecases/LoginClientUseCase'

export function buildClientDeps() {
  const db = new DBClient<Database>(pool)
  const repo = new ClientRepository(db)
  const authService = new ClientAuthService()
  return {
    registerUseCase: new RegisterClientUseCase(repo, authService),
    loginUseCase: new LoginClientUseCase(repo, authService),
  }
}
