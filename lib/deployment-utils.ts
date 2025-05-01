/**
 * Utility functions for deployment-related tasks
 */

// Check if running in production environment
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

// Format environment variable for use in logs (masking sensitive data)
export function formatEnvVar(name: string, value?: string): string {
  if (!value) return "undefined"

  // Mask sensitive values
  const sensitiveVars = ["KEY", "SECRET", "PASSWORD", "TOKEN"]
  const isSensitive = sensitiveVars.some((keyword) => name.includes(keyword.toUpperCase()))

  if (isSensitive) {
    if (value.length <= 8) return "********"
    return `${value.substring(0, 3)}${"*".repeat(value.length - 6)}${value.substring(value.length - 3)}`
  }

  return value
}

// Safely access environment variables with defaults
export function getEnvVar(name: string, defaultValue = ""): string {
  const value = process.env[name]
  return value || defaultValue
}

// Validate required environment variables
export function validateEnvVars(requiredVars: string[]): { valid: boolean; missing: string[] } {
  const missing = requiredVars.filter((varName) => !process.env[varName])
  return {
    valid: missing.length === 0,
    missing,
  }
}

// Generate deployment config for client
export function getClientDeploymentConfig() {
  return {
    appName: getEnvVar("NEXT_PUBLIC_APP_NAME", "POS System"),
    deploymentRegion: getEnvVar("VERCEL_REGION", "unknown"),
    deploymentId: getEnvVar("VERCEL_DEPLOYMENT_ID", "local"),
    version: getEnvVar("NEXT_PUBLIC_APP_VERSION", "1.0.0"),
    buildTime: getEnvVar("NEXT_PUBLIC_BUILD_TIME", new Date().toISOString()),
  }
}
