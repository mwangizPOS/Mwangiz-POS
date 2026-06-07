export type EntityId = string

export type IdempotencyKey = string

export type DateTimeString = string

export type MoneyAmount = number

export type Percentage = number

export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export type JsonObject = {
  [key: string]: JsonValue | undefined
}
