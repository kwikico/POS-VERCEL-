"use client"

import { useState, useMemo, memo, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ProductCard from "@/components/product-catalog/product-card"
import type { Product } from "@/types/pos-types"
import { QuickAccessButton } from "@/components/quick-access-button"
import { useInView } from "react-intersection-observer"
import { LoadingState } from "@/components/ui/loading-state"

interface ProductCatalogProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  isLoading?: boolean
}

const PRODUCTS_PER_PAGE = 6
const QUICK_ACCESS_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-lime-500",
  "bg-orange-500",
]

function ProductCatalogComponent({ products, onAddToCart, isLoading = false }: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter products based on search query - memoized with proper dependencies
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products

    const query = searchQuery.toLowerCase()
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.barcode && product.barcode.toLowerCase().includes(query))
      )
    })
  }, [products, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)

  // Get current page products - memoized
  const currentProducts = useMemo(() => {
    const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE
    const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE
    return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  }, [filteredProducts, currentPage])

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Set up intersection observer for lazy loading
  const { ref: productGridRef, inView } = useInView({
    triggerOnce: false,
    rootMargin: "200px 0px",
    threshold: 0.1,
  })

  if (isLoading) {
    return (
      <Card className="bg-white shadow-md border border-slate-200 h-full">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <LoadingState text="Loading products..." size="md" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white shadow-md border border-slate-200 h-full">
      <CardContent className="p-4 space-y-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Products</h2>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search products by name, category, or barcode..."
              className="pl-8 border-slate-300 focus:border-slate-400 focus:ring-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-500 mb-3">Quick Access Products</h3>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, index) => (
              <QuickAccessButton
                key={`button${index + 1}`}
                color={QUICK_ACCESS_COLORS[index]}
                productId={`button${index + 1}`}
                products={products}
                onSelect={onAddToCart}
              />
            ))}
          </div>
        </div>

        <div ref={productGridRef}>
          {inView ? (
            <div className="grid grid-cols-6 gap-3">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onClick={onAddToCart} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-slate-500">
                  {searchQuery ? `No products found matching "${searchQuery}"` : "No products available"}
                </div>
              )}
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <LoadingState text="Loading products..." size="sm" />
            </div>
          )}
        </div>

        {/* Pagination controls - only show if we have more than one page */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="border-slate-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="border-slate-300"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Use memo to prevent unnecessary re-renders
export default memo(ProductCatalogComponent)
