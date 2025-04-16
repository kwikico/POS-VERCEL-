import { supabase } from "@/lib/supabase"
import type { CartItem, Transaction } from "@/types/pos-types"

export async function saveTransaction(transaction: Transaction): Promise<boolean> {
  try {
    // First, insert the transaction record
    const { error: transactionError } = await supabase.from("transactions").insert({
      id: transaction.id,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      total: transaction.total,
      timestamp: transaction.timestamp.toISOString(),
      payment_method: transaction.paymentMethod,
      is_return: transaction.isReturn,
    })

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

      return {
        id: tx.id,
        items,
        subtotal: tx.subtotal,
        tax: tx.tax,
        total: tx.total,
        timestamp: new Date(tx.timestamp),
        paymentMethod: tx.payment_method,
        isReturn: tx.is_return,
      } as Transaction
    })
  } catch (error) {
    console.error("Error in getTransactions:", error)
    return []
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
