"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import { saveProducts, getProducts } from "@/services/product-service"
import { mockProducts } from "@/data/mock-products"
import type { Product } from "@/types/pos-types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load products from Supabase on initial render
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // Load products from Supabase
        const { data: fetchedProducts, error } = await getProducts()

        if (error) {
          // Show error toast but continue with available data
          toast({
            title: "Warning",
            description: error.message,
            variant: "destructive",
          })
          setError(error.message)
        }

        // If we have products (even fallback ones), use them
        if (fetchedProducts && fetchedProducts.length > 0) {
          setProducts(fetchedProducts)
        } else {
          // If no products at all, use mock products and save them
          setProducts(mockProducts)
          await saveProducts(mockProducts)
        }
      } catch (error) {
        console.error("Unexpected error in useProducts:", error)
        setError("An unexpected error occurred while loading products")

        // Fallback to mock products if loading fails
        setProducts(mockProducts)

        toast({
          title: "Error",
          description: "Failed to load products. Using default data.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Save products to Supabase whenever they change
  useEffect(() => {
    if (products.length > 0 && !isLoading) {
      saveProducts(products).then(({ error }) => {
        if (error) {
          console.error("Failed to save products:", error)
          // Only show toast for non-initial saves to avoid duplicate errors
          if (!isLoading) {
            toast({
              title: "Warning",
              description: "Changes may not be saved to the database",
              variant: "destructive",
            })
          }
        }
      })
    }
  }, [products, isLoading])

  // Find a product by barcode
  const findProductByBarcode = useCallback(
    (barcode: string): Product | undefined => {
      return products.find((product) => product.barcode === barcode)
    },
    [products],
  )

  const updateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts)
  }

  return {
    products,
    isLoading,
    error,
    updateProducts,
    findProductByBarcode,
  }
}
