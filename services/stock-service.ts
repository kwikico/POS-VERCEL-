import { supabase } from "@/lib/supabase"
import type { StockAlert, ProductSalesReport } from "@/types/pos-types"
import { type ServiceResponse, ErrorType, createError, handleError } from "@/lib/error-utils"

export async function updateProductStock(productId: string, quantityChange: number): Promise<ServiceResponse<boolean>> {
  try {
    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock, units_sold")
      .eq("id", productId)
      .single()

    if (fetchError) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to fetch current stock", fetchError, 500),
      }
    }

    const currentStock = product.stock || 0
    const currentUnitsSold = product.units_sold || 0
    const newStock = Math.max(0, currentStock + quantityChange) // Prevent negative stock

    // Update stock and units sold
    const updateData: any = {
      stock: newStock,
    }

    // If it's a sale (negative quantity change), update units sold
    if (quantityChange < 0) {
      updateData.units_sold = currentUnitsSold + Math.abs(quantityChange)
    }

    const { error: updateError } = await supabase.from("products").update(updateData).eq("id", productId)

    if (updateError) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to update stock", updateError, 500),
      }
    }

    // Check if we need to create a low stock alert
    await checkAndCreateStockAlert(productId)

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to update product stock"),
    }
  }
}

export async function checkAndCreateStockAlert(productId: string): Promise<void> {
  try {
    const { data: product } = await supabase
      .from("products")
      .select("id, name, stock, min_stock_level, category, tracking_category")
      .eq("id", productId)
      .single()

    if (!product || !product.min_stock_level) return

    const currentStock = product.stock || 0
    const minLevel = product.min_stock_level

    if (currentStock <= minLevel) {
      // Check if alert already exists
      const { data: existingAlert } = await supabase
        .from("stock_alerts")
        .select("id")
        .eq("product_id", productId)
        .eq("is_active", true)
        .single()

      if (!existingAlert) {
        // Create new alert
        await supabase.from("stock_alerts").insert({
          product_id: productId,
          product_name: product.name,
          current_stock: currentStock,
          min_stock_level: minLevel,
          category: product.category,
          tracking_category: product.tracking_category,
          is_active: true,
          created_at: new Date().toISOString(),
        })
      }
    }
  } catch (error) {
    console.error("Error checking stock alert:", error)
  }
}

export async function getStockAlerts(): Promise<ServiceResponse<StockAlert[]>> {
  try {
    const { data, error } = await supabase
      .from("stock_alerts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to fetch stock alerts", error, 500),
      }
    }

    const alerts: StockAlert[] = data.map((alert) => ({
      id: alert.id,
      productId: alert.product_id,
      productName: alert.product_name,
      currentStock: alert.current_stock,
      minStockLevel: alert.min_stock_level,
      category: alert.category,
      trackingCategory: alert.tracking_category,
      isActive: alert.is_active,
      createdAt: new Date(alert.created_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : undefined,
    }))

    return { data: alerts, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to fetch stock alerts"),
    }
  }
}

export async function acknowledgeStockAlert(alertId: string): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("stock_alerts")
      .update({
        is_active: false,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", alertId)

    if (error) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to acknowledge alert", error, 500),
      }
    }

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to acknowledge stock alert"),
    }
  }
}

export async function getProductSalesReport(
  startDate?: Date,
  endDate?: Date,
  category?: string,
  trackingCategory?: string,
): Promise<ServiceResponse<ProductSalesReport[]>> {
  try {
    let query = supabase.from("products").select(`
        id,
        name,
        category,
        tracking_category,
        stock,
        min_stock_level,
        units_sold,
        price,
        cost_price
      `)

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    if (trackingCategory && trackingCategory !== "all") {
      query = query.eq("tracking_category", trackingCategory)
    }

    const { data: products, error } = await query

    if (error) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to fetch products for report", error, 500),
      }
    }

    // Get transaction data for the date range
    // Based on the original table creation, transaction_items uses 'price' not 'unit_price'
    let transactionQuery = supabase.from("transaction_items").select(`
    product_id,
    quantity,
    transactions!inner(created_at, is_return)
  `)

    if (startDate) {
      transactionQuery = transactionQuery.gte("transactions.created_at", startDate.toISOString())
    }

    if (endDate) {
      transactionQuery = transactionQuery.lte("transactions.created_at", endDate.toISOString())
    }

    const { data: transactionItems, error: transactionError } = await transactionQuery

    if (transactionError) {
      console.error("Error fetching transaction data:", transactionError)
      // Return empty data if transaction query fails, but still show product data
      const reports: ProductSalesReport[] = products.map((product) => {
        const currentStock = product.stock || 0
        const minStockLevel = product.min_stock_level || 0

        let stockStatus: "in-stock" | "low-stock" | "out-of-stock" = "in-stock"
        if (currentStock === 0) {
          stockStatus = "out-of-stock"
        } else if (currentStock <= minStockLevel) {
          stockStatus = "low-stock"
        }

        return {
          productId: product.id,
          productName: product.name,
          category: product.category,
          trackingCategory: product.tracking_category,
          currentStock,
          minStockLevel,
          unitsSold: 0,
          totalRevenue: 0,
          averagePrice: product.price,
          lastSold: undefined,
          stockStatus,
          daysOfStock: undefined,
        }
      })

      return { data: reports, error: null }
    }

    // Process the data
    const salesData = new Map<
      string,
      {
        unitsSold: number
        lastSold?: Date
      }
    >()

    if (transactionItems) {
      transactionItems.forEach((item: any) => {
        const productId = item.product_id
        const quantity = item.transactions.is_return ? -item.quantity : item.quantity
        const saleDate = new Date(item.transactions.created_at)

        if (salesData.has(productId)) {
          const existing = salesData.get(productId)!
          existing.unitsSold += quantity
          if (!existing.lastSold || saleDate > existing.lastSold) {
            existing.lastSold = saleDate
          }
        } else {
          salesData.set(productId, {
            unitsSold: quantity,
            lastSold: saleDate,
          })
        }
      })
    }

    const reports: ProductSalesReport[] = products.map((product) => {
      const sales = salesData.get(product.id) || { unitsSold: 0 }
      const currentStock = product.stock || 0
      const minStockLevel = product.min_stock_level || 0

      let stockStatus: "in-stock" | "low-stock" | "out-of-stock" = "in-stock"
      if (currentStock === 0) {
        stockStatus = "out-of-stock"
      } else if (currentStock <= minStockLevel) {
        stockStatus = "low-stock"
      }

      // Calculate days of stock based on average daily sales
      let daysOfStock: number | undefined
      if (sales.unitsSold > 0 && startDate && endDate) {
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const avgDailySales = sales.unitsSold / daysDiff
        if (avgDailySales > 0) {
          daysOfStock = Math.floor(currentStock / avgDailySales)
        }
      }

      const totalRevenue = sales.unitsSold * product.price

      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        trackingCategory: product.tracking_category,
        currentStock,
        minStockLevel,
        unitsSold: sales.unitsSold,
        totalRevenue,
        averagePrice: sales.unitsSold !== 0 ? totalRevenue / sales.unitsSold : product.price,
        lastSold: sales.lastSold,
        stockStatus,
        daysOfStock,
      }
    })

    return { data: reports, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to generate product sales report"),
    }
  }
}

export async function updateProductStockSettings(
  productId: string,
  minStockLevel: number,
  trackingCategory?: string,
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("products")
      .update({
        min_stock_level: minStockLevel,
        tracking_category: trackingCategory,
        is_trackable: minStockLevel > 0,
      })
      .eq("id", productId)

    if (error) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to update stock settings", error, 500),
      }
    }

    // Check if we need to create an alert with the new settings
    await checkAndCreateStockAlert(productId)

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to update product stock settings"),
    }
  }
}
