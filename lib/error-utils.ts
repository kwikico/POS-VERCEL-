import { toast } from "@/components/ui/use-toast"

// Define error types for better error handling
export enum ErrorType {
  NETWORK = "network",
  DATABASE = "database",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  NOT_FOUND = "not_found",
  UNKNOWN = "unknown",
}

// Define a structured error response
export interface ErrorResponse {
  type: ErrorType
  message: string
  details?: any
  status?: number
}

// Create a structured error
export function createError(type: ErrorType, message: string, details?: any, status?: number): ErrorResponse {
  return {
    type,
    message,
    details,
    status,
  }
}

// Handle errors and show toast notifications
export function handleError(error: any, fallbackMessage = "An unexpected error occurred"): ErrorResponse {
  console.error("Error:", error)

  // Determine if it's a structured error or create one
  const errorResponse: ErrorResponse = error.type
    ? error
    : createError(ErrorType.UNKNOWN, error.message || fallbackMessage, error, error.status || 500)

  // Show toast notification with appropriate message
  toast({
    title: getErrorTitle(errorResponse.type),
    description: errorResponse.message,
    variant: "destructive",
  })

  return errorResponse
}

// Get user-friendly error titles based on error type
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK:
      return "Network Error"
    case ErrorType.DATABASE:
      return "Database Error"
    case ErrorType.VALIDATION:
      return "Validation Error"
    case ErrorType.AUTHENTICATION:
      return "Authentication Error"
    case ErrorType.AUTHORIZATION:
      return "Authorization Error"
    case ErrorType.NOT_FOUND:
      return "Not Found"
    case ErrorType.UNKNOWN:
    default:
      return "Error"
  }
}

// Type for service function responses
export interface ServiceResponse<T> {
  data: T | null
  error: ErrorResponse | null
}
