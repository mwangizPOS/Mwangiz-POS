export const EventProcessingErrorCode = {
  ValidationFailed: 'ValidationFailed',
  DuplicateEvent: 'DuplicateEvent',
  MissingProjection: 'MissingProjection',
  InvariantViolation: 'InvariantViolation',
  UnsupportedEvent: 'UnsupportedEvent',
} as const

export type EventProcessingErrorCode =
  (typeof EventProcessingErrorCode)[keyof typeof EventProcessingErrorCode]

export class EventProcessingError extends Error {
  readonly code: EventProcessingErrorCode

  constructor(code: EventProcessingErrorCode, message: string) {
    super(message)
    this.name = 'EventProcessingError'
    this.code = code
  }
}
