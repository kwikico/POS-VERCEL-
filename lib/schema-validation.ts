import { supabase } from "./supabase"

export interface SchemaValidationResult {
  isValid: boolean
  missingTables: string[]
  missingColumns: Record<string, string[]>
}

export async function validateDatabaseSchema(): Promise<SchemaValidationResult> {
  const result: SchemaValidationResult = {
    isValid: true,
    missingTables: [],
    missingColumns: {},
  }

  try {
    // Check if required tables exist
    const requiredTables = ["products", "transactions", "transaction_items"]

    for (const table of requiredTables) {
      const { data, error } = await supabase.from(table).select("*").limit(1)

      if (error && error.code === "42P01") {
        // Table doesn't exist
        result.isValid = false
        result.missingTables.push(table)
      }
    }

    // Check if required columns exist in transactions table
    if (!result.missingTables.includes("transactions")) {
      const requiredColumns = [
        "id",
        "subtotal",
        "tax",
        "total",
        "timestamp",
        "payment_method",
        "is_return",
        "discount_type",
        "discount_value",
        "discount_description",
        "discount_amount",
      ]

      const { data: columns, error } = await supabase.rpc("get_table_columns", { table_name: "transactions" })

      if (!error && columns) {
        const existingColumns = columns.map((col: any) => col.column_name)
        const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col))

        if (missingColumns.length > 0) {
          result.isValid = false
          result.missingColumns["transactions"] = missingColumns
        }
      }
    }

    return result
  } catch (error) {
    console.error("Error validating database schema:", error)
    result.isValid = false
    return result
  }
}

export async function createRequiredTables(): Promise<boolean> {
  try {
    // Create products table if it doesn't exist
    const { error: productsError } = await supabase.rpc("create_products_table_if_not_exists")

    if (productsError) {
      console.error("Error creating products table:", productsError)
      return false
    }

    // Create transactions table if it doesn't exist
    const { error: transactionsError } = await supabase.rpc("create_transactions_table_if_not_exists")

    if (transactionsError) {
      console.error("Error creating transactions table:", transactionsError)
      return false
    }

    // Create transaction_items table if it doesn't exist
    const { error: itemsError } = await supabase.rpc("create_transaction_items_table_if_not_exists")

    if (itemsError) {
      console.error("Error creating transaction_items table:", itemsError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error creating required tables:", error)
    return false
  }
}
