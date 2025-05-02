"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { saveProducts, getProducts } from "@/services/product-service"
import { mockProducts } from "@/data/mock-products"
import type { Product } from "@/types/pos-types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load products from Supabase on initial render
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Load products from Supabase
        const fetchedProducts = await getProducts()

        // If no products in database yet, use mock products and save them
        if (fetchedProducts.length === 0) {
          setProducts(mockProducts)
          await saveProducts(mockProducts)
        } else {
          setProducts(fetchedProducts)
        }
      } catch (error) {
        console.error("Failed to load products:", error)
        toast({
          title: "Error",
          description: "Failed to load products. Using default data.",
          variant: "destructive",
        })

        // Fallback to mock products if loading fails
        setProducts(mockProducts)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Save products to Supabase whenever they change
  useEffect(() => {
    if (products.length > 0 && !isLoading) {
      saveProducts(products).catch((error) => {
        console.error("Failed to save products:", error)
      })
    }
  }, [products, isLoading])

  const updateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts)
  }

  return {
    products,
    isLoading,
    updateProducts,
  }
}
