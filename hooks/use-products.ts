"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Product, ProductFilters } from "@/types/pos-types"
import { getProducts, addProduct, updateProduct, deleteProduct, getProductByBarcode } from "@/services/product-service"
import { mockProducts } from "@/data/mock-products"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = useCallback(async (filters?: ProductFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getProducts(filters)

      if (result.error) {
        setError(result.error.message)
        // Use mock data as fallback
        setProducts(mockProducts)
        toast({
          title: "Warning",
          description: "Using demo data. " + result.error.message,
          variant: "destructive",
        })
      } else {
        setProducts(result.data || [])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products"
      setError(errorMessage)
      setProducts(mockProducts)
      toast({
        title: "Error",
        description: "Using demo data. " + errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addNewProduct = useCallback(async (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    try {
      const result = await addProduct(productData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        })
        return false
      }

      if (result.data) {
        setProducts((prev) => [result.data!, ...prev])
        toast({
          title: "Success",
          description: `${result.data.name} has been added successfully`,
        })
        return true
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add product"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
    return false
  }, [])

  const updateExistingProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const result = await updateProduct(id, updates)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        })
        return false
      }

      if (result.data) {
        setProducts((prev) => prev.map((product) => (product.id === id ? result.data! : product)))
        toast({
          title: "Success",
          description: `${result.data.name} has been updated successfully`,
        })
        return true
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update product"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
    return false
  }, [])

  const removeProduct = useCallback(async (id: string) => {
    try {
      const result = await deleteProduct(id)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        })
        return false
      }

      setProducts((prev) => prev.filter((product) => product.id !== id))
      toast({
        title: "Success",
        description: "Product has been deleted successfully",
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
    return false
  }, [])

  const findProductByBarcode = useCallback(async (barcode: string): Promise<Product | null> => {
    try {
      const result = await getProductByBarcode(barcode)

      if (result.error) {
        console.error("Error finding product by barcode:", result.error.message)
        return null
      }

      return result.data
    } catch (err) {
      console.error("Failed to find product by barcode:", err)
      return null
    }
  }, [])

  const getProductById = useCallback(
    (id: string): Product | undefined => {
      return products.find((product) => product.id === id)
    },
    [products],
  )

  const searchProducts = useCallback(
    (query: string): Product[] => {
      if (!query.trim()) return products

      const searchTerm = query.toLowerCase()
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm) ||
          (product.barcode && product.barcode.toLowerCase().includes(searchTerm)),
      )
    },
    [products],
  )

  const getProductsByCategory = useCallback(
    (category: string): Product[] => {
      return products.filter((product) => product.category === category)
    },
    [products],
  )

  const getLowStockProducts = useCallback((): Product[] => {
    return products.filter((product) => {
      const stock = product.stock || 0
      const minLevel = product.minStockLevel || 0
      return stock <= minLevel && stock > 0
    })
  }, [products])

  const getOutOfStockProducts = useCallback((): Product[] => {
    return products.filter((product) => (product.stock || 0) === 0)
  }, [products])

  return {
    products,
    isLoading,
    error,
    loadProducts,
    addNewProduct,
    updateExistingProduct,
    removeProduct,
    findProductByBarcode,
    getProductById,
    searchProducts,
    getProductsByCategory,
    getLowStockProducts,
    getOutOfStockProducts,
    refreshProducts: () => loadProducts(),
  }
}

export default useProducts
