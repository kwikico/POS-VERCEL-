import { supabase } from "@/lib/supabase"
import type { Product } from "@/types/pos-types"

export async function saveProducts(products: Product[]): Promise<boolean> {
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
}

export async function getProducts(): Promise<Product[]> {
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
}

export async function deleteProduct(productId: string): Promise<boolean> {
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
}
