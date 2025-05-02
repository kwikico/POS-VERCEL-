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
    }

    // First, insert the transaction record with only the guaranteed fields
    const { error: transactionError } = await supabase.from("transactions").insert(transactionData)

    if (transactionError) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to save transaction", transactionError, 500),
      }
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

export async function getRecentTransactions(limit = 10): Promise<ServiceResponse<Transaction[]>> {
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
      return {
        data: [],
        error: createError(ErrorType.DATABASE, "Failed to fetch recent transactions", error, 500),
      }
    }

    // Transform the data to match our Transaction type
    const transactions = data.map((tx) => {
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
        taxApplied: tx.tax_applied !== undefined ? tx.tax_applied : true,
      } as Transaction
    })

    return { data: transactions, error: null }
  } catch (error) {
    return {
      data: [],
      error: handleError(error, "Failed to fetch recent transactions"),
    }
  }
}

export async function updateTransaction(transaction: Transaction): Promise<ServiceResponse<boolean>> {
  try {
    // Prepare transaction data for update
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
      discount_amount: transaction.discountAmount || null,
    }

    // Update the transaction record
    const { error: transactionError } = await supabase
      .from("transactions")
      .update(transactionData)
      .eq("id", transaction.id)

    if (transactionError) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to update transaction", transactionError, 500),
      }
    }

    // Delete existing transaction items
    const { error: deleteItemsError } = await supabase
      .from("transaction_items")
      .delete()
      .eq("transaction_id", transaction.id)

    if (deleteItemsError) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to delete existing transaction items", deleteItemsError, 500),
      }
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
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to save updated transaction items", itemsError, 500),
      }
    }

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to update transaction"),
    }
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
