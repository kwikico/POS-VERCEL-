"use client"

import { useState, useEffect, useMemo } from "react"
import { getProducts } from "@/services/product-service"
import type { Product } from "@/types/pos-types"

interface UseTagSuggestionsProps {
  currentTags: string[]
  query: string
}

export function useTagSuggestions({ currentTags, query }: UseTagSuggestionsProps) {
  const [allTags, setAllTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch all tags from products
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true)
      try {
        const { data: products } = await getProducts()
        if (products) {
          // Extract all unique tags from all products
          const tagSet = new Set<string>()
          products.forEach((product: Product) => {
            if (product.tags) {
              product.tags.forEach((tag: string) => {
                if (tag.trim()) {
                  tagSet.add(tag.trim())
                }
              })
            }
          })
          setAllTags(Array.from(tagSet).sort())
        }
      } catch (error) {
        console.error("Error fetching tags:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTags()
  }, [])

  // Filter suggestions based on query and exclude already selected tags
  const suggestions = useMemo(() => {
    if (!query.trim()) return []

    const queryLower = query.toLowerCase().trim()

    return allTags
      .filter((tag) => {
        // Filter out already selected tags
        if (currentTags.includes(tag)) return false

        // Filter by query
        return tag.toLowerCase().includes(queryLower)
      })
      .slice(0, 10) // Limit to 10 suggestions for performance
  }, [allTags, currentTags, query])

  // Check if the current query would create a new tag
  const isNewTag = useMemo(() => {
    if (!query.trim()) return false

    const queryTrimmed = query.trim()
    return !allTags.includes(queryTrimmed) && !currentTags.includes(queryTrimmed)
  }, [allTags, currentTags, query])

  return {
    suggestions,
    isNewTag,
    isLoading,
    allTags,
  }
}
