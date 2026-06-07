import type { JsonObject } from '@/types/primitives'

export interface ApiSuccessResponse<TData> {
  success: true
  data: TData
  requestId?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: JsonObject
  }
  requestId?: string
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse
