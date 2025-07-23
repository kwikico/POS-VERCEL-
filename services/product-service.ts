import { supabase } from "@/lib/supabase"
import { cache, cacheKeys } from "@/lib/cache"
import { withRetry } from "@/lib/error-utils"
import { validateProduct } from "@/lib/validation"
import { APP_CONFIG } from "@/lib/constants"
import type { Product, ProductFilters } from "@/types/pos-types"
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
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Transform database row to Product type
function transformProductFromDb(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    costPrice: row.cost_price,
    category: row.category,
    imageUrl: row.image_url || "/placeholder.svg?height=100&width=100",
    barcode: row.barcode,
    stock: row.stock,
    minStockLevel: row.min_stock_level,
    maxStockLevel: row.max_stock_level,
    isManualEntry: row.is_manual_entry,
    quickAdd: row.quick_add,
    tags: row.tags || [],
    trackingCategory: row.tracking_category,
    isTrackable: row.is_trackable || false,
    unitsSold: row.units_sold,
    customPrice: row.custom_price || false,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  }
}

// Transform Product to database format
function transformProductToDb(product: Product | Omit<Product, "id" | "createdAt" | "updatedAt">) {
  return {
    ...("id" in product && { id: product.id }),
    name: product.name,
    price: product.price,
    cost_price: product.costPrice,
    category: product.category,
    image_url: product.imageUrl,
    barcode: product.barcode || null,
    stock: product.stock || 0,
    min_stock_level: product.minStockLevel,
    max_stock_level: product.maxStockLevel,
    is_manual_entry: product.isManualEntry || false,
    quick_add: product.quickAdd || false,
    tags: product.tags || [],
    tracking_category: product.trackingCategory,
    is_trackable: product.isTrackable || false,
    units_sold: product.unitsSold || 0,
    custom_price: product.customPrice || false,
    updated_at: new Date().toISOString(),
    ...(!("id" in product) && { created_at: new Date().toISOString() }),
  }
}

// Optimized product service with caching and error handling
export async function saveProducts(products: Product[]): Promise<ServiceResponse<boolean>> {
  try {
    console.log("=== SAVE PRODUCTS SERVICE ===")
    console.log("Products to save:", products.length)

    // Validate all products
    const validationErrors: string[] = []
    const validatedProducts = products
      .map((product, index) => {
        const validation = validateProduct(product)
        if (!validation.success) {
          validationErrors.push(`Product ${index + 1}: ${validation.error.issues.map((i) => i.message).join(", ")}`)
          return null
        }
        return validation.data
      })
      .filter(Boolean) as Product[]

    if (validationErrors.length > 0) {
      console.error("Validation errors:", validationErrors)
      return {
        data: null,
        error: createError(
          ErrorType.VALIDATION,
          `Validation failed: ${validationErrors.join("; ")}`,
          validationErrors,
          400,
        ),
      }
    }

    // Format products for Supabase
    const formattedProducts = validatedProducts.map(transformProductToDb)
    console.log("Formatted products for DB:", formattedProducts)

    // Use retry mechanism for database operations
    const result = await withRetry(
      async () => {
        const { error } = await supabase.from("products").upsert(formattedProducts, { onConflict: "id" })

        if (error) {
          console.error("Supabase upsert error:", error)
          throw error
        }
        return true
      },
      3,
      1000,
    )

    console.log("Save products result:", result)

    // Update cache
    cache.delete(cacheKeys.products())

    // Update barcode cache for products with barcodes
    for (const product of validatedProducts) {
      if (product.barcode) {
        barcodeCache.set(product.barcode, true)
        cache.set(cacheKeys.productByBarcode(product.barcode), product)
      }
      cache.set(cacheKeys.productById(product.id), product)
    }

    return { data: true, error: null }
  } catch (error) {
    console.error("Save products service error:", error)
    return {
      data: null,
      error: handleError(error, "Failed to save products"),
    }
  }
}

export async function getProducts(filters?: ProductFilters): Promise<ServiceResponse<Product[]>> {
  try {
    console.log("=== GET PRODUCTS SERVICE ===")
    console.log("Filters:", filters)

    // Check cache first
    const cacheKey = filters ? `products:filtered:${JSON.stringify(filters)}` : cacheKeys.products()
    const cachedProducts = cache.get<Product[]>(cacheKey)

    if (cachedProducts) {
      console.log("Returning cached products:", cachedProducts.length)
      return { data: cachedProducts, error: null }
    }

    // Build query with filters
    let query = supabase.from("products").select("*")

    if (filters?.category) {
      query = query.eq("category", filters.category)
    }

    if (filters?.trackingCategory) {
      query = query.eq("tracking_category", filters.trackingCategory)
    }

    if (filters?.stockStatus) {
      switch (filters.stockStatus) {
        case "out-of-stock":
          query = query.eq("stock", 0)
          break
        case "low-stock":
          query = query.gt("stock", 0).lte("stock", supabase.raw("min_stock_level"))
          break
        case "in-stock":
          query = query.gt("stock", supabase.raw("min_stock_level"))
          break
      }
    }

    if (filters?.priceRange) {
      query = query.gte("price", filters.priceRange[0]).lte("price", filters.priceRange[1])
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,category.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`,
      )
    }

    const { data, error } = await query.order("name")

    if (error) {
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

    console.log("Fetched products from DB:", data?.length || 0)

    // Transform and cache the data
    const products = data.map(transformProductFromDb)
    cache.set(cacheKey, products, APP_CONFIG.CACHE.PRODUCTS_TTL)

    // Cache individual products
    for (const product of products) {
      cache.set(cacheKeys.productById(product.id), product)
      if (product.barcode) {
        cache.set(cacheKeys.productByBarcode(product.barcode), product)
        barcodeCache.set(product.barcode, true)
      }
    }

    return { data: products, error: null }
  } catch (error) {
    console.error("Critical error in getProducts:", error)
    return {
      data: FALLBACK_PRODUCTS,
      error: handleError(error, "Failed to fetch products. Using fallback data."),
    }
  }
}

export async function getProductById(id: string): Promise<ServiceResponse<Product | null>> {
  try {
    console.log("=== GET PRODUCT BY ID SERVICE ===")
    console.log("Product ID:", id)

    // Check cache first
    const cachedProduct = cache.get<Product>(cacheKeys.productById(id))
    if (cachedProduct) {
      console.log("Returning cached product:", cachedProduct.name)
      return { data: cachedProduct, error: null }
    }

    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        console.log("Product not found")
        return { data: null, error: null }
      }
      console.error("Error fetching product by ID:", error)
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to fetch product", error, 500),
      }
    }

    const product = transformProductFromDb(data)
    cache.set(cacheKeys.productById(id), product)

    console.log("Fetched product from DB:", product.name)
    return { data: product, error: null }
  } catch (error) {
    console.error("Error in getProductById:", error)
    return {
      data: null,
      error: handleError(error, "Failed to fetch product by ID"),
    }
  }
}

export async function addProduct(
  product: Omit<Product, "id" | "createdAt" | "updatedAt">,
): Promise<ServiceResponse<Product>> {
  try {
    console.log("=== ADD PRODUCT SERVICE ===")
    console.log("Product data:", product)

    // Validate product
    const validation = validateProduct({
      ...product,
      id: "temp-id", // Temporary ID for validation
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!validation.success) {
      console.error("Validation failed:", validation.error.issues)
      return {
        data: null,
        error: createError(
          ErrorType.VALIDATION,
          validation.error.issues.map((i) => i.message).join(", "),
          validation.error,
          400,
        ),
      }
    }

    // Generate ID and timestamps
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("New product with ID:", newProduct)

    const formattedProduct = transformProductToDb(newProduct)
    console.log("Formatted product for DB:", formattedProduct)

    const { data, error } = await supabase.from("products").insert(formattedProduct).select().single()

    if (error) {
      console.error("Supabase insert error:", error)
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to add product", error, 500),
      }
    }

    console.log("Product inserted successfully:", data)

    // Transform the returned data
    const insertedProduct = transformProductFromDb(data)

    // Update cache
    cache.delete(cacheKeys.products())
    cache.set(cacheKeys.productById(insertedProduct.id), insertedProduct)

    if (insertedProduct.barcode) {
      cache.set(cacheKeys.productByBarcode(insertedProduct.barcode), insertedProduct)
      barcodeCache.set(insertedProduct.barcode, true)
    }

    return { data: insertedProduct, error: null }
  } catch (error) {
    console.error("Error in addProduct:", error)
    return {
      data: null,
      error: handleError(error, "Failed to add product"),
    }
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<ServiceResponse<Product>> {
  try {
    console.log("=== UPDATE PRODUCT SERVICE ===")
    console.log("Product ID:", id)
    console.log("Updates:", updates)

    // Get existing product
    const existingResult = await getProductById(id)
    if (existingResult.error || !existingResult.data) {
      console.error("Product not found for update")
      return {
        data: null,
        error: createError(ErrorType.NOT_FOUND, "Product not found", null, 404),
      }
    }

    // Merge updates with existing product
    const updatedProduct: Product = {
      ...existingResult.data,
      ...updates,
      updatedAt: new Date(),
    }

    console.log("Merged product data:", updatedProduct)

    // Validate updated product
    const validation = validateProduct(updatedProduct)
    if (!validation.success) {
      console.error("Validation failed for update:", validation.error.issues)
      return {
        data: null,
        error: createError(
          ErrorType.VALIDATION,
          validation.error.issues.map((i) => i.message).join(", "),
          validation.error,
          400,
        ),
      }
    }

    const formattedProduct = transformProductToDb(validation.data)
    console.log("Formatted product for DB update:", formattedProduct)

    const { data, error } = await supabase.from("products").update(formattedProduct).eq("id", id).select().single()

    if (error) {
      console.error("Supabase update error:", error)
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to update product", error, 500),
      }
    }

    console.log("Product updated successfully:", data)

    // Transform the returned data
    const updatedProductResult = transformProductFromDb(data)

    // Update cache
    cache.delete(cacheKeys.products())
    cache.set(cacheKeys.productById(id), updatedProductResult)

    if (updatedProductResult.barcode) {
      cache.set(cacheKeys.productByBarcode(updatedProductResult.barcode), updatedProductResult)
      barcodeCache.set(updatedProductResult.barcode, true)
    }

    return { data: updatedProductResult, error: null }
  } catch (error) {
    console.error("Error in updateProduct:", error)
    return {
      data: null,
      error: handleError(error, "Failed to update product"),
    }
  }
}

export async function deleteProduct(productId: string): Promise<ServiceResponse<boolean>> {
  try {
    console.log("=== DELETE PRODUCT SERVICE ===")
    console.log("Product ID:", productId)

    // Get product to find its barcode before deletion
    const { data: product } = await supabase.from("products").select("barcode").eq("id", productId).single()

    // Delete the product
    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      console.error("Supabase delete error:", error)
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to delete product from database", error, 500),
      }
    }

    console.log("Product deleted successfully")

    // Update cache
    cache.delete(cacheKeys.products())
    cache.delete(cacheKeys.productById(productId))

    // If the product had a barcode, update the cache
    if (product && product.barcode) {
      barcodeCache.set(product.barcode, false)
      cache.delete(cacheKeys.productByBarcode(product.barcode))
    }

    return { data: true, error: null }
  } catch (error) {
    console.error("Error in deleteProduct:", error)
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

    // Check cache first
    const cachedProduct = cache.get<Product>(cacheKeys.productByBarcode(barcode))
    if (cachedProduct) {
      return { data: cachedProduct, error: null }
    }

    const { data, error } = await supabase.from("products").select("*").eq("barcode", barcode).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - product not found
        barcodeCache.set(barcode, false)
        return { data: null, error: null }
      }

      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to fetch product by barcode", error, 500),
      }
    }

    // Transform and cache the data
    const product = transformProductFromDb(data)
    cache.set(cacheKeys.productByBarcode(barcode), product)
    cache.set(cacheKeys.productById(product.id), product)
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
    barcodeCache.set(barcode, exists)

    return { data: exists, error: null }
  } catch (error) {
    return {
      data: false,
      error: handleError(error, "Failed to check if barcode exists"),
    }
  }
}

// Bulk operations for better performance
export async function bulkUpdateProducts(
  updates: Array<{ id: string; updates: Partial<Product> }>,
): Promise<ServiceResponse<boolean>> {
  try {
    const operations = updates.map(async ({ id, updates: productUpdates }) => {
      return updateProduct(id, productUpdates)
    })

    const results = await Promise.allSettled(operations)
    const failures = results.filter((result) => result.status === "rejected" || result.value.error)

    if (failures.length > 0) {
      return {
        data: null,
        error: createError(
          ErrorType.DATABASE,
          `Failed to update ${failures.length} out of ${updates.length} products`,
          failures,
          500,
        ),
      }
    }

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to bulk update products"),
    }
  }
}

export async function searchProducts(query: string, limit = 20): Promise<ServiceResponse<Product[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return {
        data: [],
        error: createError(ErrorType.VALIDATION, "Search query must be at least 2 characters", null, 400),
      }
    }

    const searchTerm = query.trim()
    const cacheKey = `search:${searchTerm}:${limit}`

    // Check cache first
    const cachedResults = cache.get<Product[]>(cacheKey)
    if (cachedResults) {
      return { data: cachedResults, error: null }
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
      .limit(limit)
      .order("name")

    if (error) {
      return {
        data: null,
        error: createError(ErrorType.DATABASE, "Failed to search products", error, 500),
      }
    }

    const products = data.map(transformProductFromDb)

    // Cache results for a shorter time since search results can change frequently
    cache.set(cacheKey, products, APP_CONFIG.CACHE.REPORTS_TTL)

    return { data: products, error: null }
  } catch (error) {
    return {
      data: null,
      error: handleError(error, "Failed to search products"),
    }
  }
}
