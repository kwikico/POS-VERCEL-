"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Edit, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getStorageItem, setStorageItem, removeStorageItem } from "@/lib/storage-utils"
import { STORAGE_KEYS } from "@/lib/constants"
import type { Product } from "@/types/pos-types"

interface QuickAccessButtonProps {
  color: string
  productId: string
  products: Product[]
  onSelect: (product: Product) => void
}

function QuickAccessButtonComponent({ color, productId, products, onSelect }: QuickAccessButtonProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Load saved product ID from localStorage
  useEffect(() => {
    const savedProductId = getStorageItem<string | null>(`${STORAGE_KEYS.QUICK_ACCESS_PREFIX}${productId}`, null)
    if (savedProductId) {
      setSelectedProductId(savedProductId)
    }
  }, [productId])

  // Save product ID to localStorage when changed
  useEffect(() => {
    if (selectedProductId) {
      setStorageItem(`${STORAGE_KEYS.QUICK_ACCESS_PREFIX}${productId}`, selectedProductId)
    }
  }, [selectedProductId, productId])

  // Find the selected product from the products array
  const selectedProduct = selectedProductId ? products.find((p) => p.id === selectedProductId) : null

  // Filter products based on search query - memoized with useCallback
  const getFilteredProducts = useCallback(() => {
    if (!searchQuery) return products

    const query = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query)),
    )
  }, [products, searchQuery])

  // Handle product selection
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProductId(product.id)
    setIsEditing(false)
  }, [])

  // Handle button click
  const handleButtonClick = useCallback(() => {
    if (selectedProduct) {
      onSelect(selectedProduct)
    } else {
      setIsEditing(true)
    }
  }, [selectedProduct, onSelect])

  // Handle clear button
  const handleClear = useCallback(() => {
    setSelectedProductId(null)
    removeStorageItem(`${STORAGE_KEYS.QUICK_ACCESS_PREFIX}${productId}`)
    setIsEditing(false)
  }, [productId])

  // Get filtered products only when needed
  const filteredProducts = getFilteredProducts()

  return (
    <>
      <div className="relative group">
        <Button
          className={`w-full h-24 flex flex-col items-center justify-center text-white ${color} hover:opacity-90 transition-all shadow-md hover:shadow-lg border border-white/10`}
          onClick={handleButtonClick}
        >
          {selectedProduct ? (
            <>
              <div className="font-medium text-sm truncate w-full text-center px-1">{selectedProduct.name}</div>
              <div className="text-xs opacity-90 mt-1 font-bold">${selectedProduct.price.toFixed(2)}</div>
              <div className="text-xs opacity-75 mt-0.5 capitalize bg-white/20 px-2 py-0.5 rounded-full">
                {selectedProduct.category}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-sm">Configure</span>
              <Edit className="h-4 w-4 mt-1 opacity-70" />
            </div>
          )}
        </Button>

        <button
          className="absolute top-1 right-1 bg-white/30 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          aria-label="Edit quick access button"
        >
          <Edit className="h-3.5 w-3.5 text-white" />
        </button>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Quick Access Button</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Search products by name, category, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
              aria-label="Search products"
            />

            <ScrollArea className="h-[300px] rounded-md border p-2">
              <div className="space-y-2">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                        selectedProductId === product.id ? "bg-slate-100" : "hover:bg-slate-50"
                      }`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-slate-500">
                          ${product.price.toFixed(2)} - {product.category}
                          {product.barcode && <span className="ml-2 font-mono text-xs">{product.barcode}</span>}
                        </div>
                      </div>
                      {selectedProductId === product.id && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500">No products found matching "{searchQuery}"</div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Clear Button
              </Button>
              <Button onClick={() => setIsEditing(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Use memo to prevent unnecessary re-renders
export const QuickAccessButton = memo(QuickAccessButtonComponent)
