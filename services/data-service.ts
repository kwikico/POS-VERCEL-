import { supabase } from "@/lib/supabase"
import type { Product, Transaction, CartItem, Discount } from "@/types/pos-types"

// Product Services
export const ProductService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from("products").select("*")

      if (error) {
        console.error("Error fetching products:", error)
        return []
      }

      // Transform the data to match our Product type
      return data.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.image_url || "/placeholder.svg?height=100&width=100",
        barcode: product.barcode,
        stock: product.stock,
        isManualEntry: product.is_manual_entry,
        quickAdd: product.quick_add,
        tags: product.tags,
      }))
    } catch (error) {
      console.error("Error in getProducts:", error)
      return []
    }
  },

  async save(products: Product[]): Promise<boolean> {
    try {
      // Format products for Supabase
      const formattedProducts = products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        image_url: product.imageUrl,
        barcode: product.barcode || null,
        stock: product.stock || 0,
        is_manual_entry: product.isManualEntry || false,
        quick_add: product.quickAdd || false,
        tags: product.tags || [],
      }))

      // Upsert products (insert if not exists, update if exists)
      const { error } = await supabase.from("products").upsert(formattedProducts, { onConflict: "id" })

      if (error) {
        console.error("Error saving products:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in saveProducts:", error)
      return false
    }
  },

  async delete(productId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) {
        console.error("Error deleting product:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in deleteProduct:", error)
      return false
    }
  },
}

// Transaction Services
export const TransactionService = {
  async save(transaction: Transaction): Promise<boolean> {
    try {
      // Create a base transaction object with only the essential fields
      const transactionData = {
        id: transaction.id,
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        total: transaction.total,
        timestamp: transaction.timestamp.toISOString(),
        payment_method: transaction.paymentMethod,
        is_return: transaction.isReturn,
        // Add discount fields if they exist
        ...(transaction.discount
          ? {
              discount_type: transaction.discount.type,
              discount_value: transaction.discount.value,
              discount_description: transaction.discount.description,
              discount_amount: transaction.discountAmount,
            }
          : {}),
      }

      // First, insert the transaction record
      const { error: transactionError } = await supabase.from("transactions").insert(transactionData)

      if (transactionError) {
        console.error("Error saving transaction:", transactionError)
        return false
      }

      // Then, insert all transaction items
      const transactionItems = transaction.items.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        category: item.product.category,
      }))

      const { error: itemsError } = await supabase.from("transaction_items").insert(transactionItems)

      if (itemsError) {
        console.error("Error saving transaction items:", itemsError)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in saveTransaction:", error)
      return false
    }
  },

  async getAll(startDate?: Date, endDate?: Date): Promise<Transaction[]> {
    try {
      let query = supabase
        .from("transactions")
        .select(`
          *,
          items:transaction_items(*)
        `)
        .order("timestamp", { ascending: false })

      if (startDate) {
        query = query.gte("timestamp", startDate.toISOString())
      }

      if (endDate) {
        query = query.lte("timestamp", endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching transactions:", error)
        return []
      }

      // Transform the data to match our Transaction type
      return data.map((tx) => {
        const items = tx.items.map((item: any) => ({
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            category: item.category,
            imageUrl: "/placeholder.svg?height=100&width=100",
          },
          quantity: item.quantity,
        })) as CartItem[]

        // Build discount object if discount data exists
        let discount: Discount | undefined
        if (tx.discount_type && tx.discount_value) {
          discount = {
            type: tx.discount_type,
            value: tx.discount_value,
            description:
              tx.discount_description ||
              `${tx.discount_type === "percentage" ? tx.discount_value + "%" : "$" + tx.discount_value} discount`,
          }
        }

        return {
          id: tx.id,
          items,
          subtotal: tx.subtotal,
          discount,
          discountAmount: tx.discount_amount,
          tax: tx.tax,
          total: tx.total,
          timestamp: new Date(tx.timestamp),
          paymentMethod: tx.payment_method,
          isReturn: tx.is_return,
          taxApplied: true, // Default to true since the column doesn't exist in DB
        } as Transaction
      })
    } catch (error) {
      console.error("Error in getTransactions:", error)
      return []
    }
  },

  async getRecent(limit = 10): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          items:transaction_items(*)
        `)
        .order("timestamp", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching recent transactions:", error)
        return []
      }

      // Transform the data to match our Transaction type
      return data.map((tx) => {
        const items = tx.items.map((item: any) => ({
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            category: item.category,
            imageUrl: "/placeholder.svg?height=100&width=100",
          },
          quantity: item.quantity,
        })) as CartItem[]

        // Build discount object if discount data exists
        let discount: Discount | undefined
        if (tx.discount_type && tx.discount_value) {
          discount = {
            type: tx.discount_type,
            value: tx.discount_value,
            description:
              tx.discount_description ||
              `${tx.discount_type === "percentage" ? tx.discount_value + "%" : "$" + tx.discount_value} discount`,
          }
        }

        return {
          id: tx.id,
          items,
          subtotal: tx.subtotal,
          discount,
          discountAmount: tx.discount_amount,
          tax: tx.tax,
          total: tx.total,
          timestamp: new Date(tx.timestamp),
          paymentMethod: tx.payment_method,
          isReturn: tx.is_return,
          taxApplied: true, // Default to true since the column doesn't exist in DB
        } as Transaction
      })
    } catch (error) {
      console.error("Error in getRecentTransactions:", error)
      return []
    }
  },

  async getDailySummary(date: Date): Promise<{
    totalSales: number
    totalReturns: number
    transactionCount: number
  }> {
    try {
      // Set the start and end of the day
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from("transactions")
        .select("total, is_return")
        .gte("timestamp", startOfDay.toISOString())
        .lte("timestamp", endOfDay.toISOString())

      if (error) {
        console.error("Error fetching daily summary:", error)
        return { totalSales: 0, totalReturns: 0, transactionCount: 0 }
      }

      const totalSales = data.filter((tx) => !tx.is_return).reduce((sum, tx) => sum + Number(tx.total), 0)

      const totalReturns = data.filter((tx) => tx.is_return).reduce((sum, tx) => sum + Math.abs(Number(tx.total)), 0)

      return {
        totalSales,
        totalReturns,
        transactionCount: data.length,
      }
    } catch (error) {
      console.error("Error in getDailyTransactionSummary:", error)
      return { totalSales: 0, totalReturns: 0, transactionCount: 0 }
    }
  },

  async update(transaction: Transaction): Promise<boolean> {
    try {
      // Update the transaction record
      const updateData = {
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        total: transaction.total,
        timestamp: transaction.timestamp.toISOString(),
        payment_method: transaction.paymentMethod,
        is_return: transaction.isReturn,
        // Add discount fields if they exist
        ...(transaction.discount
          ? {
              discount_type: transaction.discount.type,
              discount_value: transaction.discount.value,
              discount_description: transaction.discount.description,
              discount_amount: transaction.discountAmount,
            }
          : {
              // Clear discount fields if no discount
              discount_type: null,
              discount_value: null,
              discount_description: null,
              discount_amount: null,
            }),
      }

      const { error: transactionError } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", transaction.id)

      if (transactionError) {
        console.error("Error updating transaction:", transactionError)
        return false
      }

      // Delete existing transaction items
      const { error: deleteError } = await supabase
        .from("transaction_items")
        .delete()
        .eq("transaction_id", transaction.id)

      if (deleteError) {
        console.error("Error deleting transaction items:", deleteError)
        return false
      }

      // Insert updated transaction items
      const transactionItems = transaction.items.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        category: item.product.category,
      }))

      const { error: itemsError } = await supabase.from("transaction_items").insert(transactionItems)

      if (itemsError) {
        console.error("Error saving updated transaction items:", itemsError)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in updateTransaction:", error)
      return false
    }
  },
}
