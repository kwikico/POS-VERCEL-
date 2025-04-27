import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Create products table if it doesn't exist
    await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          category TEXT NOT NULL,
          image_url TEXT,
          barcode TEXT,
          stock INTEGER DEFAULT 0,
          is_manual_entry BOOLEAN DEFAULT FALSE,
          quick_add BOOLEAN DEFAULT FALSE,
          tags TEXT[] DEFAULT '{}'::TEXT[]
        );
      `,
    })

    // Create transactions table if it doesn't exist
    await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          subtotal DECIMAL(10, 2) NOT NULL,
          tax DECIMAL(10, 2) NOT NULL,
          total DECIMAL(10, 2) NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          payment_method TEXT NOT NULL,
          is_return BOOLEAN DEFAULT FALSE,
          discount_type TEXT,
          discount_value DECIMAL(10, 2),
          discount_description TEXT,
          discount_amount DECIMAL(10, 2)
        );
      `,
    })

    // Create transaction_items table if it doesn't exist
    await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS transaction_items (
          id SERIAL PRIMARY KEY,
          transaction_id TEXT NOT NULL REFERENCES transactions(id),
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          quantity INTEGER NOT NULL,
          category TEXT NOT NULL
        );
      `,
    })

    // Add missing columns to transactions table if needed
    await supabase.rpc("execute_sql", {
      sql_query: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'transactions' AND column_name = 'discount_type') THEN
            ALTER TABLE transactions ADD COLUMN discount_type TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'transactions' AND column_name = 'discount_value') THEN
            ALTER TABLE transactions ADD COLUMN discount_value DECIMAL(10, 2);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'transactions' AND column_name = 'discount_description') THEN
            ALTER TABLE transactions ADD COLUMN discount_description TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'transactions' AND column_name = 'discount_amount') THEN
            ALTER TABLE transactions ADD COLUMN discount_amount DECIMAL(10, 2);
          END IF;
        END $$;
      `,
    })

    return NextResponse.json({ success: true, message: "Database migration completed successfully" })
  } catch (error) {
    console.error("Database migration failed:", error)
    return NextResponse.json(
      { success: false, message: "Database migration failed", error: String(error) },
      { status: 500 },
    )
  }
}
