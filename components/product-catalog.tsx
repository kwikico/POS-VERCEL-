"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import BarcodeProductModal from "@/components/barcode-product-modal"
import QuickAccessButtons from "@/components/quick-access-buttons"
import ProductCard from "@/components/product-card"
import type { Product } from "@/types/pos-types"

interface ProductCatalogProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onOpenManualEntry: () => void
  onAddProduct: (product: Product) => void
  isLoading?: boolean
}

export default function ProductCatalog({
  products,
  onAddToCart,
  onOpenManualEntry,
  onAddProduct,
  isLoading = false,
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showNotFoundDialog, setShowNotFoundDialog] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const productsPerPage = 12
  const barcodeRegex = /^\d{8,14}$/ // Basic barcode format validation

  // Focus the search input field on component mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Handle keyboard events for the not found dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showNotFoundDialog) return

      if (e.key.toLowerCase() === "y") {
        setShowNotFoundDialog(false)
        setShowAddProductModal(true)
      } else if (e.key.toLowerCase() === "n" || e.key === "Escape") {
        setShowNotFoundDialog(false)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showNotFoundDialog])

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery.toLowerCase()))
    return matchesSearch
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    // Check if the search query looks like a barcode
    if (barcodeRegex.test(searchQuery.trim())) {
      // Find product by barcode
      const product = products.find((p) => p.barcode === searchQuery.trim())

      if (product) {
        // Product found, add to cart
        onAddToCart(product)
        setSearchQuery("")
      } else {
        // Product not found, show dialog
        setScannedBarcode(searchQuery.trim())
        setShowNotFoundDialog(true)
        // Don't clear search query yet, we might need it for adding a new product
      }
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // If input looks like a complete barcode and ends with Enter key character
    if (barcodeRegex.test(value.trim()) && value.includes("\n")) {
      // Remove the Enter key character
      const cleanBarcode = value.trim().replace(/\n/g, "")
      setSearchQuery(cleanBarcode)

      // Find product by barcode
      const product = products.find((p) => p.barcode === cleanBarcode)

      if (product) {
        // Product found, add to cart
        onAddToCart(product)
        setSearchQuery("")
      } else {
        // Product not found, show dialog
        setScannedBarcode(cleanBarcode)
        setShowNotFoundDialog(true)
      }
    }
  }

  const handleAddProduct = (newProduct: Product) => {
    // Add the product to inventory
    onAddProduct(newProduct)

    // Add the product to cart
    onAddToCart(newProduct)

    // Close the modal
    setShowAddProductModal(false)

    // Clear the search field
    setSearchQuery("")

    // Refocus the search input
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const handleCloseAddProductModal = () => {
    setShowAddProductModal(false)
    setSearchQuery("")
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  if (isLoading) {
    return (
      <Card className="bg-white shadow-md border border-slate-200 h-full">
        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            <p className="mt-2 text-slate-500">Loading products...</p>
            <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
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

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search products or scan barcode..."
            className="pl-8 border-slate-300 focus:border-slate-400 focus:ring-slate-400"
            value={searchQuery}
            onChange={handleSearchChange}
            autoComplete="off"
          />
        </form>

        {/* Quick Access Buttons */}
        <QuickAccessButtons products={products} onAddToCart={onAddToCart} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {currentProducts.map((product) => (
            <ProductCard key={product.id} product={product} onClick={onAddToCart} />
          ))}

          {currentProducts.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No products found. Try a different search.
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

        {/* Product Not Found Dialog */}
        <AlertDialog open={showNotFoundDialog} onOpenChange={setShowNotFoundDialog}>
          <AlertDialogContent className="max-w-[350px] p-6">
            <div className="text-center">
              <p className="mb-4">Product not found. Press [N] to cancel or [Y] to add product.</p>
              <p className="text-sm text-slate-500">Barcode: {scannedBarcode}</p>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Product Modal */}
        <BarcodeProductModal
          isOpen={showAddProductModal}
          barcode={scannedBarcode}
          onClose={handleCloseAddProductModal}
          onSave={handleAddProduct}
          categories={Array.from(new Set(products.map((p) => p.category))).filter(
            (category) => !["custom-price"].includes(category),
          )}
        />
      </CardContent>
    </Card>
  )
}
