import { appEventSchema } from '../../validation/index.js'
import type { AppEvent } from '../../events/index.js'

export function validateIncomingEvent(input: unknown): AppEvent {
  return appEventSchema.parse(input) as AppEvent
}
