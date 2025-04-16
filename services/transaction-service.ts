import { supabase } from "@/lib/supabase"
import type { CartItem, Transaction, Discount } from "@/types/pos-types"

export async function saveTransaction(transaction: Transaction): Promise<boolean> {
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
}

export async function getTransactions(startDate?: Date, endDate?: Date): Promise<Transaction[]> {
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
        taxApplied: tx.tax_applied !== undefined ? tx.tax_applied : true, // Default to true for backward compatibility
      } as Transaction
    })
  } catch (error) {
    console.error("Error in getTransactions:", error)
    return []
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
        taxApplied: tx.tax_applied !== undefined ? tx.tax_applied : true,
      } as Transaction
    })
  } catch (error) {
    console.error("Error in getRecentTransactions:", error)
    return []
  }
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        items:transaction_items(*)
      `)
      .eq("id", id)
      .single()

    if (error || !data) {
      console.error("Error fetching transaction:", error)
      return null
    }

    // Transform the data to match our Transaction type
    const items = data.items.map((item: any) => ({
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
    if (data.discount_type && data.discount_value) {
      discount = {
        type: data.discount_type,
        value: data.discount_value,
        description:
          data.discount_description ||
          `${data.discount_type === "percentage" ? data.discount_value + "%" : "$" + data.discount_value} discount`,
      }
    }

    return {
      id: data.id,
      items,
      subtotal: data.subtotal,
      discount,
      discountAmount: data.discount_amount,
      tax: data.tax,
      total: data.total,
      timestamp: new Date(data.timestamp),
      paymentMethod: data.payment_method,
      isReturn: data.is_return,
      taxApplied: data.tax_applied !== undefined ? data.tax_applied : true,
    } as Transaction
  } catch (error) {
    console.error("Error in getTransactionById:", error)
    return null
  }
}

export async function updateTransaction(transaction: Transaction): Promise<boolean> {
  try {
    // First, update the transaction record
    const { error: transactionError } = await supabase
      .from("transactions")
      .update({
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        total: transaction.total,
        timestamp: transaction.timestamp.toISOString(),
        payment_method: transaction.paymentMethod,
        is_return: transaction.isReturn,
        tax_applied: transaction.taxApplied,
      })
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
}

export async function getDailyTransactionSummary(date: Date): Promise<{
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
}
