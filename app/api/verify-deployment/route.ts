import { NextResponse } from "next/server"
import { validateEnvVars } from "@/lib/deployment-utils"

// Verify that all required environment variables are set for proper deployment
export async function GET() {
  // Define required environment variables for different functionalities
  const requiredVars = {
    supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    database: ["POSTGRES_URL", "POSTGRES_USER", "POSTGRES_PASSWORD"],
    application: ["NEXT_PUBLIC_APP_NAME", "NEXT_PUBLIC_APP_VERSION"],
  }

  // Validate each group
  const results = Object.entries(requiredVars).map(([groupName, vars]) => {
    const validation = validateEnvVars(vars)
    return {
      group: groupName,
      valid: validation.valid,
      missing: validation.missing,
    }
  })

  // Overall status
  const allValid = results.every((group) => group.valid)

  return NextResponse.json({
    status: allValid ? "ready" : "missing-configuration",
    results,
    timestamp: new Date().toISOString(),
  })
}
