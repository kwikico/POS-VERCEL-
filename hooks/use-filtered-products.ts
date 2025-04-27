"use client"

import { useMemo } from "react"
import type { Product } from "@/types/pos-types"

export function useFilteredProducts(
  products: Product[],
  searchQuery: string,
  selectedCategory?: string,
): {
  filteredProducts: Product[]
  categories: string[]
} {
  // Get unique categories from products
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)))
  }, [products])

  // Filter products based on search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchQuery.toLowerCase()))

      const matchesCategory = !selectedCategory || selectedCategory === "all" || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  return { filteredProducts, categories }
}
