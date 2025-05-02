"use client"

import { memo, useCallback } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CartItem as CartItemType } from "@/types/pos-types"

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
}

function CartItemComponent({ item, onUpdateQuantity, onRemoveItem }: CartItemProps) {
  const { product, quantity } = item

  // Calculate item total
  const itemTotal = product.price * quantity

  // Handle quantity changes
  const decreaseQuantity = useCallback(() => {
    onUpdateQuantity(product.id, quantity - 1)
  }, [product.id, quantity, onUpdateQuantity])

  const increaseQuantity = useCallback(() => {
    onUpdateQuantity(product.id, quantity + 1)
  }, [product.id, quantity, onUpdateQuantity])

  // Handle item removal
  const handleRemove = useCallback(() => {
    onRemoveItem(product.id)
  }, [product.id, onRemoveItem])

  return (
    <div className="p-3 hover:bg-slate-50 transition-colors">
      <div className="flex justify-between mb-1">
        <div className="font-medium">{product.name}</div>
        <div className="font-medium">${itemTotal.toFixed(2)}</div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-500 capitalize">
          {product.category}
          {product.barcode && <span className="ml-2 text-xs font-mono text-slate-400">{product.barcode}</span>}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border-slate-300"
            onClick={decreaseQuantity}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </Button>

          <span className="w-8 text-center tabular-nums">{quantity}</span>

          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border-slate-300"
            onClick={increaseQuantity}
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50"
            onClick={handleRemove}
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Use memo to prevent unnecessary re-renders
export const CartItem = memo(CartItemComponent)
