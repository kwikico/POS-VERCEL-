import { supabase } from "@/lib/supabase"
import type { CartItem, Transaction, Discount } from "@/types/pos-types"
import { type ServiceResponse, ErrorType, createError, handleError } from "@/lib/error-utils"

export async function saveTransaction(transaction: Transaction): Promise<ServiceResponse<boolean>> {
  try {
    // Create a base transaction object with only the original fields
    const transactionData = {
      id: transaction.id,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      total: transaction.total,
      timestamp: transaction.timestamp.toISOString(),
      payment_method: transaction.paymentMethod,
      is_return: transaction.isReturn,
      // Include discount information if available
      discount_type: transaction.discount?.type || null,
      discount_value: transaction.discount?.value || null,
      discount_description: transaction.discount?.description || null,
      // Don't include discount_amount as it's not in the schema
    }

    // First, insert the transaction record with only the guaranteed fields
    const { error: transactionError } = await supabase.from("transactions").insert(transactionData)

    if (transactionError) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to save transaction", transactionError, 500),
      }
    }

    // Ensure items is an array
    const items = Array.isArray(transaction.items) ? transaction.items : []

    // Then, insert all transaction items
    const transactionItems = items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product.id,
      product_name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      category: item.product.category,
    }))

    const { error: itemsError } = await supabase.from("transaction_items").insert(transactionItems)

    if (itemsError) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to save transaction items", itemsError, 500),
      }
    }

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to save transaction"),
    }
  }
}

export async function getTransactions(startDate?: Date, endDate?: Date): Promise<ServiceResponse<Transaction[]>> {
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
      return {
        data: [],
        error: createError(ErrorType.DATABASE, "Failed to fetch transactions", error, 500),
      }
    }

    // Transform the data to match our Transaction type
    const transactions = data.map((tx) => {
      // Ensure items is an array
      const txItems = Array.isArray(tx.items) ? tx.items : []

      const items = txItems.map((item: any) => ({
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
      let discountAmount: number | undefined = undefined

      if (tx.discount_type && tx.discount_value) {
        discount = {
          type: tx.discount_type as "percentage" | "fixed",
          value: tx.discount_value,
          description:
            tx.discount_description ||
            `${tx.discount_type === "percentage" ? tx.discount_value + "%" : "$" + tx.discount_value} discount`,
        }

        // Calculate discount amount since it's not stored in the database
        if (discount.type === "percentage") {
          discountAmount = (tx.subtotal * discount.value) / 100
        } else {
          discountAmount = discount.value
        }
      }

      return {
        id: tx.id,
        items,
        subtotal: tx.subtotal,
        discount,
        discountAmount,
        tax: tx.tax,
        total: tx.total,
        timestamp: new Date(tx.timestamp),
        paymentMethod: tx.payment_method,
        isReturn: tx.is_return,
        taxApplied: tx.tax_applied !== undefined ? tx.tax_applied : true, // Default to true for backward compatibility
      } as Transaction
    })

    return { data: transactions, error: null }
  } catch (error) {
    return {
      data: [],
      error: handleError(error, "Failed to fetch transactions"),
    }
  }
}

export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
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
      console.error("Failed to fetch recent transactions:", error)
      return []
    }

    // Transform the data to match our Transaction type
    const transactions = data.map((tx) => {
      // Ensure items is an array
      const txItems = Array.isArray(tx.items) ? tx.items : []

      const items = txItems.map((item: any) => ({
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
      let discountAmount: number | undefined = undefined

      if (tx.discount_type && tx.discount_value) {
        discount = {
          type: tx.discount_type as "percentage" | "fixed",
          value: tx.discount_value,
          description:
            tx.discount_description ||
            `${tx.discount_type === "percentage" ? tx.discount_value + "%" : "$" + tx.discount_value} discount`,
        }

        // Calculate discount amount since it's not stored in the database
        if (discount.type === "percentage") {
          discountAmount = (tx.subtotal * discount.value) / 100
        } else {
          discountAmount = discount.value
        }
      }

      return {
        id: tx.id,
        items,
        subtotal: tx.subtotal,
        discount,
        discountAmount,
        tax: tx.tax,
        total: tx.total,
        timestamp: new Date(tx.timestamp),
        paymentMethod: tx.payment_method,
        isReturn: tx.is_return,
        taxApplied: tx.tax_applied !== undefined ? tx.tax_applied : true,
      } as Transaction
    })

    return transactions
  } catch (error) {
    console.error("Error in getRecentTransactions:", error)
    return []
  }
}

export async function updateTransaction(transaction: Transaction): Promise<boolean> {
  try {
    // Prepare transaction data for update, excluding discount_amount which doesn't exist in the schema
    const transactionData = {
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      total: transaction.total,
      timestamp: transaction.timestamp.toISOString(),
      payment_method: transaction.paymentMethod,
      is_return: transaction.isReturn,
      tax_applied: transaction.taxApplied,
      discount_type: transaction.discount?.type || null,
      discount_value: transaction.discount?.value || null,
      discount_description: transaction.discount?.description || null,
      // Remove discount_amount as it's not in the schema
    }

    // Update the transaction record
    const { error: transactionError } = await supabase
      .from("transactions")
      .update(transactionData)
      .eq("id", transaction.id)

    if (transactionError) {
      console.error("Failed to update transaction:", transactionError)
      return false
    }

    // Delete existing transaction items
    const { error: deleteItemsError } = await supabase
      .from("transaction_items")
      .delete()
      .eq("transaction_id", transaction.id)

    if (deleteItemsError) {
      console.error("Failed to delete existing transaction items:", deleteItemsError)
      return false
    }

    // Ensure items is an array
    const items = Array.isArray(transaction.items) ? transaction.items : []

    // Insert updated transaction items
    const transactionItems = items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product.id,
      product_name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      category: item.product.category,
    }))

    const { error: itemsError } = await supabase.from("transaction_items").insert(transactionItems)

    if (itemsError) {
      console.error("Failed to save updated transaction items:", itemsError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateTransaction:", error)
    return false
  }
}

export async function getDailyTransactionSummary(date: Date): Promise<{
  totalSales: number
  totalReturns: number
  transactionCount: number
}> {
  try {
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
      console.error("Error fetching daily transaction summary:", error)
      return { totalSales: 0, totalReturns: 0, transactionCount: 0 }
    }

    let totalSales = 0
    let totalReturns = 0

    data.forEach((tx) => {
      if (tx.is_return) {
        totalReturns += Math.abs(tx.total)
      } else {
        totalSales += tx.total
      }
    })

    return {
      totalSales,
      totalReturns,
      transactionCount: data.length,
    }
  } catch (error) {
    console.error("Error in getDailyTransactionSummary:", error)
    return { totalSales: 0, totalReturns: 0, transactionCount: 0 }
  }
}
