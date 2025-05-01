import { NextResponse } from "next/server"
import { healthCheck } from "@/lib/supabase"

// Create a health check endpoint to verify the application is running correctly in production
export async function GET() {
  try {
    // Check database connectivity
    const dbStatus = await healthCheck()

    // Check environment variables
    const envStatus = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      postgres_url: !!process.env.POSTGRES_URL,
    }

    // Get build info
    const buildInfo = {
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      status: dbStatus.status === "ok" ? "healthy" : "degraded",
      database: dbStatus,
      environment: envStatus,
      build: buildInfo,
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({ status: "error", message: "Health check failed", error: String(error) }, { status: 500 })
  }
}
