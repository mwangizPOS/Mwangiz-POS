import { reduceEvent } from './reducers'
import type { ProjectionStore } from './store'
import type { AppEvent } from '@/events'

export async function routeEvent(event: AppEvent, store: ProjectionStore) {
  return reduceEvent(event, store)
}
