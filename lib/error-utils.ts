import type { ServiceError, ServiceResponse } from "@/types/pos-types"

export enum ErrorType {
  VALIDATION = "validation",
  DATABASE = "database",
  NETWORK = "network",
  NOT_FOUND = "not_found",
  PERMISSION = "permission",
  UNKNOWN = "unknown",
}

export function createError(type: ErrorType, message: string, details?: any, code?: number): ServiceError {
  return {
    type,
    message,
    details,
    code,
  }
}

export function handleError(error: unknown, defaultMessage: string): ServiceError {
  if (error instanceof Error) {
    return createError(ErrorType.UNKNOWN, error.message, error, 500)
  }

  if (typeof error === "string") {
    return createError(ErrorType.UNKNOWN, error, null, 500)
  }

  return createError(ErrorType.UNKNOWN, defaultMessage, error, 500)
}

export async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts) {
        throw error
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError
}

export function isServiceError(obj: any): obj is ServiceError {
  return obj && typeof obj.type === "string" && typeof obj.message === "string"
}

export function createSuccessResponse<T>(data: T): ServiceResponse<T> {
  return { data, error: null }
}

export function createErrorResponse<T>(error: ServiceError): ServiceResponse<T> {
  return { data: null, error }
}
