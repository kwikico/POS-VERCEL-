import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Card header gradient component
export function CardHeaderGradient({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-pink-50 p-4">{children}</div>
}

// Calculate order totals - used in multiple components
export function calculateOrderTotals({
  items,
  discount = null,
  taxEnabled = true,
  taxRate = 0.13,
}: {
  items: { product: { price: number }; quantity: number }[]
  discount?: { type: "percentage" | "fixed"; value: number } | null
  taxEnabled?: boolean
  taxRate?: number
}) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Calculate discount amount
  const discountAmount = discount
    ? discount.type === "percentage"
      ? (subtotal * discount.value) / 100
      : discount.value
    : 0

  // Calculate subtotal after discount
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)

  // Calculate tax
  const tax = taxEnabled ? subtotalAfterDiscount * taxRate : 0

  // Calculate total
  const total = subtotalAfterDiscount + tax

  return {
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    tax,
    total,
  }
}

// Generate a unique transaction ID
export function generateTransactionId(): string {
  return `TX-${Date.now().toString().slice(-6)}`
}
