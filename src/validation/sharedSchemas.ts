import { z } from 'zod'

export const entityIdSchema = z.string().trim().min(1)

export const uuidSchema = z.string().uuid()

export const idempotencyKeySchema = z.string().trim().min(8).max(160)

export const dateTimeStringSchema = z.string().datetime({ offset: true })

export const moneyAmountSchema = z.number().nonnegative()

export const positiveMoneyAmountSchema = z.number().positive()

export const percentageSchema = z.number().min(0).max(100)

export const shortTextSchema = z.string().trim().min(1).max(160)

export const longTextSchema = z.string().trim().min(1).max(1_000)

export const phoneSchema = z.string().trim().min(7).max(32)

export const skillsSchema = z.array(shortTextSchema).default([])

export const metadataSchema = z.record(z.string(), z.unknown()).default({})

export const retryCountSchema = z.number().int().min(0)
