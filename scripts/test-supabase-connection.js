import { createClient } from "@supabase/supabase-js"

// Test Supabase connection
async function testConnection() {
  console.log("🔍 Testing Supabase Connection...\n")

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("Environment Variables:")
  console.log("- SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Not set")
  console.log("- SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Not set")
  console.log("")

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("❌ Missing environment variables. Please check your .env file.")
    return
  }

  // Create client
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Test basic connection
    console.log("Testing basic connection...")
    const { data: healthCheck, error: healthError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .limit(1)

    if (healthError) {
      console.log("❌ Connection failed:", healthError.message)
      return
    }

    console.log("✅ Basic connection successful\n")

    // Test each table
    const tables = ["products", "transactions", "transaction_items"]

    for (const table of tables) {
      console.log(`Testing ${table} table...`)

      const { data, error, count } = await supabase.from(table).select("*", { count: "exact", head: true }).limit(0)

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Table exists (${count || 0} rows)`)
      }
    }

    // Test actual transaction fetch
    console.log("\nTesting transaction fetch...")
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select(`
        *,
        items:transaction_items(*)
      `)
      .order("timestamp", { ascending: false })
      .limit(5)

    if (txError) {
      console.log("❌ Transaction fetch failed:", txError.message)
      console.log("Error details:", txError)
    } else {
      console.log(`✅ Transaction fetch successful (${transactions?.length || 0} transactions)`)
      if (transactions && transactions.length > 0) {
        console.log("Sample transaction:", JSON.stringify(transactions[0], null, 2))
      }
    }
  } catch (error) {
    console.log("❌ Unexpected error:", error.message)
    console.log("Full error:", error)
  }
}

testConnection()
