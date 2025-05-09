import { supabase } from "@/lib/supabase"
import type { Product } from "@/types/pos-types"
import { type ServiceResponse, ErrorType, createError, handleError } from "@/lib/error-utils"
import { barcodeCache } from "./barcode-cache-service"

// Default fallback products for critical failures
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "fallback-1",
    name: "Fallback Product",
    price: 0.99,
    category: "general",
    imageUrl: "/placeholder.svg?height=100&width=100",
    barcode: "fallback-barcode",
    stock: 0,
  },
]

// Optimized product service with caching
export async function saveProducts(products: Product[]): Promise<ServiceResponse<boolean>> {
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
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to save products to database", error, 500),
      }
    }

    // Update the cache for any products with barcodes
    for (const product of products) {
      if (product.barcode) {
        barcodeCache.set(product.barcode, true)
      }
    }

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to save products"),
    }
  }
}

export async function getProducts(): Promise<ServiceResponse<Product[]>> {
  try {
    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      // Log the error but return fallback data to prevent app crashes
      console.error("Error fetching products:", error)

      return {
        data: FALLBACK_PRODUCTS,
        error: createError(
          ErrorType.DATABASE,
          "Failed to fetch products from database. Using fallback data.",
          error,
          500,
        ),
      }
    }

    // Transform the data to match our Product type
    const products = data.map((product) => ({
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

    // Update the cache for all products with barcodes
    for (const product of products) {
      if (product.barcode) {
        barcodeCache.set(product.barcode, true)
      }
    }

    return { data: products, error: null }
  } catch (error) {
    // For critical errors, return fallback data to keep the app running
    console.error("Critical error in getProducts:", error)

    return {
      data: FALLBACK_PRODUCTS,
      error: handleError(error, "Failed to fetch products. Using fallback data."),
    }
  }
}

export async function deleteProduct(productId: string): Promise<ServiceResponse<boolean>> {
  try {
    // First get the product to find its barcode
    const { data: product } = await supabase.from("products").select("barcode").eq("id", productId).single()

    // Delete the product
    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to delete product from database", error, 500),
      }
    }

    // If the product had a barcode, update the cache
    if (product && product.barcode) {
      barcodeCache.set(product.barcode, false)
    }

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to delete product"),
    }
  }
}

export async function getProductByBarcode(barcode: string): Promise<ServiceResponse<Product | null>> {
  try {
    if (!barcode || barcode.trim() === "") {
      return {
        data: null,
        error: createError(ErrorType.VALIDATION, "Barcode is required", null, 400),
      }
    }

    const { data, error } = await supabase.from("products").select("*").eq("barcode", barcode).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - product not found
        // Update cache to remember this barcode doesn't exist
        barcodeCache.set(barcode, false)
        return { data: null, error: null }
      }

      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to fetch product by barcode", error, 500),
      }
    }

    // Transform the data to match our Product type
    const product: Product = {
      id: data.id,
      name: data.name,
      price: data.price,
      category: data.category,
      imageUrl: data.image_url || "/placeholder.svg?height=100&width=100",
      barcode: data.barcode,
      stock: data.stock,
      isManualEntry: data.is_manual_entry,
      quickAdd: data.quick_add,
      tags: data.tags,
    }

    // Update cache to remember this barcode exists
    barcodeCache.set(barcode, true)

    return { data: product, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to fetch product by barcode"),
    }
  }
}

// Optimized function to check if a barcode exists
export async function checkBarcodeExists(barcode: string): Promise<ServiceResponse<boolean>> {
  try {
    if (!barcode || barcode.trim() === "") {
      return {
        data: false,
        error: createError(ErrorType.VALIDATION, "Barcode is required", null, 400),
      }
    }

    // Check the cache first
    if (barcodeCache.has(barcode)) {
      const exists = barcodeCache.get(barcode)
      return { data: exists || false, error: null }
    }

    // If not in cache, query the database
    // Use count instead of fetching all fields for better performance
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("barcode", barcode)

    if (error) {
      return {
        data: false,
        error: createError(ErrorType.DATABASE, "Failed to check if barcode exists", error, 500),
      }
    }

    const exists = count !== null && count > 0

    // Update the cache with the result
    barcodeCache.set(barcode, exists)

    return { data: exists, error: null }
  } catch (error) {
    return {
      data: false,
      error: handleError(error, "Failed to check if barcode exists"),
    }
  }
}
