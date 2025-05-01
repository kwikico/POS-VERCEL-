import { createClient } from "@supabase/supabase-js"

// Define types for better type safety
type SupabaseClient = ReturnType<typeof createClient>

// Create a singleton pattern for the Supabase client
class SupabaseClientSingleton {
  private static instance: SupabaseClient | null = null
  private static serverInstance: SupabaseClient | null = null

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  // Client-side Supabase instance (with public anon key)
  public static getInstance(): SupabaseClient {
    if (!SupabaseClientSingleton.instance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Missing Supabase environment variables. Check your environment configuration.")
        // In production, this would be a serious issue, but we'll create a client anyway to avoid crashes
      }

      SupabaseClientSingleton.instance = createClient(supabaseUrl || "", supabaseAnonKey || "")
    }

    return SupabaseClientSingleton.instance
  }

  // Server-side Supabase instance (with service role key)
  public static getServerInstance(): SupabaseClient {
    if (typeof window !== "undefined") {
      throw new Error("Server client cannot be used on the client side")
    }

    if (!SupabaseClientSingleton.serverInstance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn("Missing Supabase server environment variables.")
      }

      SupabaseClientSingleton.serverInstance = createClient(supabaseUrl || "", supabaseServiceKey || "", {
        auth: {
          persistSession: false,
        },
      })
    }

    return SupabaseClientSingleton.serverInstance
  }
}

// Export the client-side Supabase client
export const supabase = SupabaseClientSingleton.getInstance()

// Export a function to get the server-side Supabase client
export function getServerSupabase() {
  return SupabaseClientSingleton.getServerInstance()
}

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!supabaseUrl && !!supabaseAnonKey
}

// Add this function to check if Supabase is accessible
export async function healthCheck(): Promise<{ status: string; message: string }> {
  try {
    const { error } = await supabase.from("transactions").select("id").limit(1)

    if (error) {
      return {
        status: "error",
        message: `Database connection error: ${error.message}`,
      }
    }

    return {
      status: "ok",
      message: "Database connection successfully established",
    }
  } catch (e) {
    return {
      status: "error",
      message: `Failed to connect to database: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}
