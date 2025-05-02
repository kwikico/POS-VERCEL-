"use client"

import { memo, useCallback, type KeyboardEvent } from "react"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/types/pos-types"

interface ProductCardProps {
  product: Product
  onClick: (product: Product) => void
}

function ProductCardComponent({ product, onClick }: ProductCardProps) {
  const handleClick = useCallback(() => {
    onClick(product)
  }, [product, onClick])

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Trigger click on Enter or Space
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onClick(product)
      }
    },
    [product, onClick],
  )

  // Create accessible name for the product
  const accessibleName = `${product.name}, ${
    product.category === "custom-price" ? "Custom price" : `$${product.price.toFixed(2)}`
  }, Category: ${product.category}`

  return (
    <div
      className="border border-slate-200 rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white flex flex-col"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={accessibleName}
    >
      {/* Product image with lazy loading and responsive sizing */}
      <div className="relative h-24 bg-slate-50 flex items-center justify-center p-2">
        <img
          src={product.imageUrl || "/placeholder.svg"}
          alt={`${product.name} product image`}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
          srcSet={`${product.imageUrl || "/placeholder.svg?height=100&width=100"} 1x, ${product.imageUrl || "/placeholder.svg?height=200&width=200"} 2x`}
          sizes="(max-width: 768px) 50vw, 100px"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=100&width=100"
            target.alt = "Product image placeholder"
          }}
        />

        {/* Quick add badge */}
        {product.quickAdd && (
          <Badge className="absolute top-1 left-1 bg-emerald-500 hover:bg-emerald-600 text-xs">QUICK</Badge>
        )}

        {/* Custom price badge */}
        {product.category === "custom-price" && (
          <Badge className="absolute top-1 left-1 bg-purple-500 hover:bg-purple-600 text-xs">CUSTOM</Badge>
        )}
      </div>

      {/* Product info */}
      <div className="p-2 flex flex-col flex-grow">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
        <div className="mt-auto flex justify-between items-end">
          <div className="text-sm font-bold">
            {product.category === "custom-price" ? (
              <span className="text-purple-600">Custom</span>
            ) : (
              <span>${product.price.toFixed(2)}</span>
            )}
          </div>
          <div className="text-xs text-slate-500 capitalize truncate max-w-[60%] text-right">{product.category}</div>
        </div>

        {/* Barcode if available - improved contrast */}
        {product.barcode && (
          <div
            className="text-xs text-slate-700 font-mono mt-1 truncate"
            title={`Barcode: ${product.barcode}`}
            aria-label={`Barcode: ${product.barcode}`}
          >
            {product.barcode}
          </div>
        )}
      </div>
    </div>
  )
}

// Use memo to prevent unnecessary re-renders
export default memo(ProductCardComponent)
