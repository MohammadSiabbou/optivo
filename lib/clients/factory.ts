/**
 * Wires up the full dependency graph for client auth use cases.
 * Called once per request in Route Handlers.
 */
import { DBClient } from '@/lib/db/DBClient'
import { pool } from '@/lib/db/pool'
import type { Database } from '@/lib/db/schema'
import { ClientRepository } from './ClientRepository'
import { ClientAuthService } from './ClientAuthService'
import { RegisterClientUseCase } from './usecases/RegisterClientUseCase'
import { LoginClientUseCase } from './usecases/LoginClientUseCase'

export function buildClientDeps() {
  const db = new DBClient<Database>(pool)
  const repo = new ClientRepository(db)
  const authService = new ClientAuthService()
  return {
    registerUseCase: new RegisterClientUseCase(repo, authService),
    loginUseCase: new LoginClientUseCase(repo, authService),
  }
}
