"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/types/pos-types"

interface ProductCardProps {
  product: Product
  onClick: (product: Product) => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-slate-200 hover:border-slate-300"
      onClick={() => onClick(product)}
    >
      <CardContent className="p-2">
        <div className="aspect-square bg-slate-100 rounded-md mb-2 flex items-center justify-center overflow-hidden relative">
          <img src={product.imageUrl || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
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
  )
}
