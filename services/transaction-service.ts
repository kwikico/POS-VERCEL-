import { supabase } from "@/lib/supabase"
import type { CartItem, Transaction, Discount } from "@/types/pos-types"
import { type ServiceResponse, ErrorType, createError, handleError } from "@/lib/error-utils"
import { updateProductStock } from "./stock-service"

// --- helper --------------------------------------------------------------
function attachPaymentDetails<T extends { id: string; payment_details?: any[] } & Record<string, any>>(
  txRows: T[],
  pdRows: any[],
) {
  const byTxId = pdRows.reduce<Record<string, any[]>>((acc, row) => {
    ;(acc[row.transaction_id] ||= []).push(row)
    return acc
  }, {})

  return txRows.map((row) => ({
    ...row,
    payment_details: byTxId[row.id] ?? [],
  }))
}
// -------------------------------------------------------------------------

export async function saveTransaction(transaction: Transaction): Promise<ServiceResponse<boolean>> {
  try {
    // Create a base transaction object with only the original fields
    const transactionData = {
      id: transaction.id,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      total: transaction.total,
      created_at: transaction.timestamp.toISOString(),
      payment_method: transaction.paymentMethod,
      is_return: transaction.isReturn,
      tax_applied: transaction.taxApplied,
      // Include discount information if available
      discount_type: transaction.discount?.type || null,
      discount_value: transaction.discount?.value || null,
      discount_description: transaction.discount?.description || null,
      discount_amount: transaction.discountAmount || null,
      // Include payment details
      amount_tendered: transaction.amountTendered || null,
      change_due: transaction.changeDue || null,
      currency: transaction.currency || "CAD",
    }

    // First, insert the transaction record
    const { error: transactionError } = await supabase.from("transactions").insert(transactionData)

    if (transactionError) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to save transaction", transactionError, 500),
      }
    }

    // Ensure items is an array
    const items = Array.isArray(transaction.items) ? transaction.items : []

    // Then, insert all transaction items and update stock
    for (const item of items) {
      const transactionItem = {
        transaction_id: transaction.id,
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        category: item.product.category,
      }

      const { error: itemError } = await supabase.from("transaction_items").insert(transactionItem)

      if (itemError) {
        console.error("Failed to save transaction item:", itemError)
        // Continue with other items even if one fails
      }

      // Update product stock
      const stockChange = transaction.isReturn ? item.quantity : -item.quantity
      await updateProductStock(item.product.id, stockChange)
    }

    // Save payment details if they exist
    if (transaction.paymentDetails && transaction.paymentDetails.length > 0) {
      const paymentDetailsData = transaction.paymentDetails.map((detail) => ({
        transaction_id: transaction.id,
        payment_method: detail.method,
        amount: detail.amount,
        reference: detail.reference || null,
      }))

      const { error: paymentError } = await supabase.from("payment_details").insert(paymentDetailsData)

      if (paymentError) {
        console.error("Error saving payment details:", paymentError)
        // Don't fail the transaction for payment detail errors
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
    console.log("🔍 Fetching transactions from database...")
    console.log("Date range:", { startDate, endDate })

    let query = supabase
      .from("transactions")
      .select(`
        *,
        items:transaction_items(*)
      `)
      .order("created_at", { ascending: false })

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString())
    }

    if (endDate) {
      query = query.lte("created_at", endDate.toISOString())
    }

    console.log("Executing query...")
    const { data, error } = await query

    if (error) {
      console.error("❌ Database query failed:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      return {
        data: [],
        error: createError(ErrorType.DATABASE, `Failed to fetch transactions: ${error.message}`, error, 500),
      }
    }

    // Fetch payment details in bulk
    const txIds = data?.map((t) => t.id) ?? []
    let pdRows: any[] = []
    if (txIds.length) {
      const { data: pdData } = await supabase.from("payment_details").select("*").in("transaction_id", txIds)
      pdRows = pdData ?? []
    }
    // Attach them to the main rows
    const rowsWithPayments = attachPaymentDetails(data ?? [], pdRows)

    console.log(`✅ Successfully fetched ${rowsWithPayments?.length || 0} transactions`)

    // Transform the data to match our Transaction type
    const transactions = rowsWithPayments.map((row) => {
      // Ensure items is an array
      const txItems = Array.isArray(row.items) ? row.items : []

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

      if (row.discount_type && row.discount_value) {
        discount = {
          type: row.discount_type as "percentage" | "fixed",
          value: row.discount_value,
          description:
            row.discount_description ||
            `${row.discount_type === "percentage" ? row.discount_value + "%" : "$" + row.discount_value} discount`,
        }

        // Use stored discount amount or calculate it
        discountAmount =
          row.discount_amount ||
          (discount.type === "percentage" ? (row.subtotal * discount.value) / 100 : discount.value)
      }

      return {
        id: row.id,
        items,
        subtotal: row.subtotal,
        discount,
        discountAmount,
        tax: row.tax,
        total: row.total,
        timestamp: new Date(row.created_at),
        paymentMethod: row.payment_method,
        isReturn: row.is_return,
        taxApplied: row.tax_applied !== undefined ? row.tax_applied : true,
        amountTendered: row.amount_tendered,
        changeDue: row.change_due,
        currency: row.currency,
        paymentDetails: row.payment_details.map((pd: any) => ({
          method: pd.payment_method,
          amount: pd.amount,
          reference: pd.reference,
        })),
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
    console.log(`🔍 Fetching ${limit} recent transactions...`)

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        items:transaction_items(*)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Failed to fetch recent transactions:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return []
    }

    // Fetch payment details for the recent set
    const ids = data?.map((t) => t.id) ?? []
    let recentPd: any[] = []
    if (ids.length) {
      const { data: pdData } = await supabase.from("payment_details").select("*").in("transaction_id", ids)
      recentPd = pdData ?? []
    }
    const rowsWithPayments = attachPaymentDetails(data ?? [], recentPd)

    console.log(`✅ Successfully fetched ${rowsWithPayments?.length || 0} recent transactions`)

    // Transform the data to match our Transaction type
    const transactions = rowsWithPayments.map((row) => {
      // Ensure items is an array
      const txItems = Array.isArray(row.items) ? row.items : []

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

      if (row.discount_type && row.discount_value) {
        discount = {
          type: row.discount_type as "percentage" | "fixed",
          value: row.discount_value,
          description:
            row.discount_description ||
            `${row.discount_type === "percentage" ? row.discount_value + "%" : "$" + row.discount_value} discount`,
        }

        // Use stored discount amount or calculate it
        discountAmount =
          row.discount_amount ||
          (discount.type === "percentage" ? (row.subtotal * discount.value) / 100 : discount.value)
      }

      return {
        id: row.id,
        items,
        subtotal: row.subtotal,
        discount,
        discountAmount,
        tax: row.tax,
        total: row.total,
        timestamp: new Date(row.created_at),
        paymentMethod: row.payment_method,
        isReturn: row.is_return,
        taxApplied: row.tax_applied !== undefined ? row.tax_applied : true,
        amountTendered: row.amount_tendered,
        changeDue: row.change_due,
        currency: row.currency,
        paymentDetails: row.payment_details.map((pd: any) => ({
          method: pd.payment_method,
          amount: pd.amount,
          reference: pd.reference,
        })),
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
    // Prepare transaction data for update
    const transactionData = {
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      total: transaction.total,
      created_at: transaction.timestamp.toISOString(),
      payment_method: transaction.paymentMethod,
      is_return: transaction.isReturn,
      tax_applied: transaction.taxApplied,
      discount_type: transaction.discount?.type || null,
      discount_value: transaction.discount?.value || null,
      discount_description: transaction.discount?.description || null,
      discount_amount: transaction.discountAmount || null,
      amount_tendered: transaction.amountTendered || null,
      change_due: transaction.changeDue || null,
      currency: transaction.currency || "CAD",
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
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString())

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
