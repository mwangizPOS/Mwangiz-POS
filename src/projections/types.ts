import type { PoolClient } from 'pg'
import type { AppEvent } from '@/events'

export const ProjectionName = {
  Main: 'main',
} as const

export type ProjectionName = (typeof ProjectionName)[keyof typeof ProjectionName]

export interface ProjectionReducerContext {
  client: PoolClient
  projectionName: string
}

export type ProjectionReducer = (
  event: AppEvent,
  context: ProjectionReducerContext,
) => Promise<void>

export interface ProjectionEngineOptions {
  projectionName?: string
  batchSize?: number
  stopOnError?: boolean
}

export interface ProjectionEventFailure {
  eventId: string
  eventType: string
  message: string
}

export interface ProjectionBatchResult {
  projectionName: string
  processed: number
  skipped: number
  failures: ProjectionEventFailure[]
  finishedAt: string
}

export interface ProjectionReplayResult {
  projectionName: string
  processed: number
  skipped: number
  failures: ProjectionEventFailure[]
  startedAt: string
  finishedAt: string
}
