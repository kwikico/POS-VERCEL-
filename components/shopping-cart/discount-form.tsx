"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Percent, DollarSignIcon as DollarIcon, Tag } from "lucide-react"
import type { Discount } from "@/types/pos-types"

interface DiscountFormProps {
  onApply: (discount: Discount) => void
  onCancel: () => void
}

export function DiscountForm({ onApply, onCancel }: DiscountFormProps) {
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<string>("")

  const handleApplyDiscount = () => {
    const parsedValue = Number.parseFloat(discountValue)
    if (!isNaN(parsedValue) && parsedValue > 0) {
      onApply({
        type: discountType,
        value: parsedValue,
        description: `${discountType === "percentage" ? parsedValue + "%" : "$" + parsedValue.toFixed(2)} discount`,
      })
      setDiscountValue("")
    }
  }

  return (
    <div className="bg-blue-50 p-3 rounded-md">
      <h4 className="text-sm font-medium mb-2 flex items-center text-blue-800">
        <Tag className="h-4 w-4 mr-1" /> Apply Discount
      </h4>
      <RadioGroup
        defaultValue="percentage"
        value={discountType}
        onValueChange={(value) => setDiscountType(value as "percentage" | "fixed")}
        className="flex space-x-2 mb-2"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="percentage" id="percentage" />
          <Label htmlFor="percentage" className="text-sm">
            Percentage (%)
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="fixed" id="fixed" />
          <Label htmlFor="fixed" className="text-sm">
            Fixed ($)
          </Label>
        </div>
      </RadioGroup>

      <div className="flex mb-2 items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            {discountType === "percentage" ? (
              <Percent className="h-4 w-4 text-gray-500" />
            ) : (
              <DollarIcon className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <Input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={discountType === "percentage" ? "10" : "5.00"}
            className="pl-8"
            min="0"
            step={discountType === "percentage" ? "1" : "0.01"}
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleApplyDiscount}>
          Apply
        </Button>
      </div>
    </div>
  )
}
