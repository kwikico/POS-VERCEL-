"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/types/pos-types"

interface ProductCardProps {
  product: Product
  onClick: (product: Product) => void
}

function ProductCardComponent({ product, onClick }: ProductCardProps) {
  const handleClick = () => {
    onClick(product)
  }

  return (
    <div
      className="border border-slate-200 rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white flex flex-col"
      onClick={handleClick}
    >
      {/* Product image */}
      <div className="relative h-24 bg-slate-50 flex items-center justify-center p-2">
        <img
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
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

        {/* Barcode if available */}
        {product.barcode && (
          <div className="text-xs text-slate-400 font-mono mt-1 truncate" title={product.barcode}>
            {product.barcode}
          </div>
        )}
      </div>
    </div>
  )
}

// Use memo to prevent unnecessary re-renders
export default memo(ProductCardComponent)
