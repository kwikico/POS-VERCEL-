"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "@/components/ui/use-toast"
import { saveProducts, getProducts } from "@/services/product-service"
import { mockProducts } from "@/data/mock-products"
import type { Product } from "@/types/pos-types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use a ref to track if we need to save products
  const needsSaveRef = useRef(false)
  // Use a ref to track the timeout for debounced saves
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
          needsSaveRef.current = true
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

  // Save products to Supabase with debouncing
  useEffect(() => {
    // Skip initial load and empty products
    if (products.length === 0 || isLoading) return

    // If we need to save products (initial mock products or updates)
    if (needsSaveRef.current || products.length > 0) {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set a new timeout to debounce saves
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/products/bulk-upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(products),
          })
          if (!res.ok) {
            console.error("Failed to save products:", await res.text())
            toast({
              title: "Warning",
              description: "Changes may not be saved to the database",
              variant: "destructive",
            })
          }
          // Reset the needs save flag
          needsSaveRef.current = false
        } catch (error) {
          console.error("Error saving products:", error)
        }
      }, 500) // 500ms debounce
    }

    // Cleanup the timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [products, isLoading])

  // Find a product by barcode
  const findProductByBarcode = useCallback(
    (barcode: string): Product | undefined => {
      return products.find((product) => product.barcode === barcode)
    },
    [products],
  )

  const updateProducts = useCallback((updatedProducts: Product[]) => {
    setProducts(updatedProducts)
    // Mark that we need to save
    needsSaveRef.current = true
  }, [])

  return {
    products,
    isLoading,
    error,
    updateProducts,
    findProductByBarcode,
  }
}
