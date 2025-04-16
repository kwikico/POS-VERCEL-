"use client"

import { useState } from "react"
import { Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/types/pos-types"

interface ProductCatalogProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onOpenManualEntry: () => void
  isLoading?: boolean
}

export default function ProductCatalog({
  products,
  onAddToCart,
  onOpenManualEntry,
  isLoading = false,
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("quickadd")
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12

  // Get unique categories from products
  const categories = [
    "all",
    "quickadd",
    "custom-price",
    ...Array.from(new Set(products.map((p) => p.category))),
  ].filter((category) => !["custom-price", "quickadd"].includes(category))

  // Filter products based on search query and selected category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      activeCategory === "all" ||
      (activeCategory === "quickadd" && product.quickAdd) ||
      (activeCategory === "custom-price" && product.category === "custom-price") ||
      product.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

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

  if (isLoading) {
    return (
      <Card className="bg-white shadow-md border border-slate-200 h-full">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            <p className="mt-2 text-slate-500">Loading products...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white shadow-md border border-slate-200 h-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Products</h2>
          <Button onClick={onOpenManualEntry} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 border-slate-300 focus:border-slate-400 focus:ring-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="quickadd" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full flex flex-wrap h-auto bg-slate-100 p-1 rounded-md">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="capitalize data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  {category === "custom-price" ? "Custom Price" : category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {currentProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-md transition-shadow border border-slate-200 hover:border-slate-300"
              onClick={() => onAddToCart(product)}
            >
              <CardContent className="p-2">
                <div className="aspect-square bg-slate-100 rounded-md mb-2 flex items-center justify-center overflow-hidden relative">
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.quickAdd && (
                    <Badge className="absolute top-1 right-1 bg-emerald-500 hover:bg-emerald-600">QUICK</Badge>
                  )}
                  {product.category === "custom-price" && (
                    <Badge className="absolute top-1 right-1 bg-purple-500 hover:bg-purple-600">CUSTOM</Badge>
                  )}
                </div>
                <div className="text-sm font-medium truncate">{product.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-bold text-slate-800">
                    {product.category === "custom-price" ? "Custom" : `$${product.price.toFixed(2)}`}
                  </span>
                  <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full truncate max-w-[80px] text-slate-600">
                    {product.category}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {currentProducts.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No products found. Try a different search or category.
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {filteredProducts.length > productsPerPage && (
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
