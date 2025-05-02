"use client"

import { memo } from "react"
import { Separator } from "@/components/ui/separator"
import type { Discount } from "@/types/pos-types"

interface CartSummaryProps {
  subtotal: number
  discount: Discount | null
  discountAmount: number
  taxEnabled: boolean
  tax: number
  total: number
}

function CartSummaryComponent({ subtotal, discount, discountAmount, taxEnabled, tax, total }: CartSummaryProps) {
  return (
    <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm">Subtotal</span>
        <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
      </div>

      {discount && (
        <div className="flex justify-between mb-1 text-blue-600">
          <span className="text-sm">Discount</span>
          <span className="text-sm font-medium">-${discountAmount.toFixed(2)}</span>
        </div>
      )}

      {taxEnabled && (
        <div className="flex justify-between mb-1">
          <span className="text-sm">Tax (13%)</span>
          <span className="text-sm font-medium">${tax.toFixed(2)}</span>
        </div>
      )}

      <Separator className="my-2" />

      <div className="flex justify-between">
        <span className="font-bold">Total</span>
        <span className="font-bold text-lg">${total.toFixed(2)}</span>
      </div>
    </div>
  )
}

// Use memo to prevent unnecessary re-renders
export const CartSummary = memo(CartSummaryComponent)
