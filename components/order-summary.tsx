import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import type { Discount } from "@/types/pos-types"

interface OrderSummaryProps {
  subtotal: number
  discount?: Discount
  discountAmount?: number
  tax: number
  total: number
  isReturn?: boolean
  taxApplied?: boolean
}

export default function OrderSummary({
  subtotal,
  discount,
  discountAmount = 0,
  tax,
  total,
  isReturn = false,
  taxApplied = true,
}: OrderSummaryProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {discount && discountAmount > 0 && (
        <div className="flex justify-between text-blue-600">
          <span>{discount.description}</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
      )}

      {taxApplied && (
        <div className="flex justify-between">
          <span>Tax (13%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
      )}

      <Separator className="my-2" />
      <div className="flex justify-between font-bold">
        <span>Total {isReturn ? "Refund" : ""}</span>
        <span>{formatCurrency(Math.abs(total))}</span>
      </div>
    </div>
  )
}
