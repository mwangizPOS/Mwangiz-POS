import { appEventSchema } from '@/validation'
import type { AppEvent } from '@/events'

export function validateIncomingEvent(input: unknown): AppEvent {
  return appEventSchema.parse(input) as AppEvent
}
