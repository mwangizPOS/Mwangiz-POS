import { z } from 'zod'

export const loginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
})

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().trim().min(32),
})

export const logoutRequestSchema = z.object({
  refreshToken: z.string().trim().min(32).optional(),
})
