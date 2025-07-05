import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Connection test function
export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...")
    console.log("Supabase URL:", supabaseUrl ? "Set" : "Not set")
    console.log("Supabase Anon Key:", supabaseAnonKey ? "Set" : "Not set")

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: "Missing Supabase environment variables",
        details: {
          url: !!supabaseUrl,
          key: !!supabaseAnonKey,
        },
      }
    }

    // Test basic connection by trying to fetch from a system table
    const { data, error } = await supabase.from("information_schema.tables").select("table_name").limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return {
        success: false,
        error: error.message,
        details: error,
      }
    }

    console.log("Supabase connection successful!")
    return {
      success: true,
      message: "Connected to Supabase successfully",
      data,
    }
  } catch (error) {
    console.error("Supabase connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    }
  }
}

// Test specific tables
export async function testSupabaseTables() {
  try {
    const results = {
      products: { exists: false, error: null },
      transactions: { exists: false, error: null },
      transaction_items: { exists: false, error: null },
    }

    // Test products table
    try {
      const { data, error } = await supabase.from("products").select("count", { count: "exact", head: true }).limit(0)

      if (error) {
        results.products.error = error.message
      } else {
        results.products.exists = true
      }
    } catch (error) {
      results.products.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test transactions table
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("count", { count: "exact", head: true })
        .limit(0)

      if (error) {
        results.transactions.error = error.message
      } else {
        results.transactions.exists = true
      }
    } catch (error) {
      results.transactions.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test transaction_items table
    try {
      const { data, error } = await supabase
        .from("transaction_items")
        .select("count", { count: "exact", head: true })
        .limit(0)

      if (error) {
        results.transaction_items.error = error.message
      } else {
        results.transaction_items.exists = true
      }
    } catch (error) {
      results.transaction_items.error = error instanceof Error ? error.message : "Unknown error"
    }

    return results
  } catch (error) {
    console.error("Table test failed:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
