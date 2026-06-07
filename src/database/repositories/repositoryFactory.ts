import type { DatabaseClient } from '../client'
import { BranchRepository } from './branchRepository'
import { EventStoreRepository } from './eventStoreRepository'
import { RefundRepository } from './refundRepository'
import { RefreshTokenRepository } from './refreshTokenRepository'
import { SaleItemRepository } from './saleItemRepository'
import { SalesRepository } from './salesRepository'
import { ServiceRepository } from './serviceRepository'
import { SettlementRepository } from './settlementRepository'
import { UserRepository } from './userRepository'
import { WorkerRepository } from './workerRepository'

export function createRepositories(client?: DatabaseClient) {
  return {
    branches: new BranchRepository(client),
    eventStore: new EventStoreRepository(client),
    refunds: new RefundRepository(client),
    refreshTokens: new RefreshTokenRepository(client),
    saleItems: new SaleItemRepository(client),
    sales: new SalesRepository(client),
    services: new ServiceRepository(client),
    settlements: new SettlementRepository(client),
    users: new UserRepository(client),
    workers: new WorkerRepository(client),
  }
}
