"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Percent, DollarSignIcon as DollarIcon } from "lucide-react"
import type { Discount } from "@/types/pos-types"

interface DiscountModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (discount: Discount) => void
}

export default function DiscountModal({ isOpen, onClose, onApply }: DiscountModalProps) {
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
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Discount</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            defaultValue="percentage"
            value={discountType}
            onValueChange={(value) => setDiscountType(value as "percentage" | "fixed")}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage">Percentage (%)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed" id="fixed" />
              <Label htmlFor="fixed">Fixed Amount ($)</Label>
            </div>
          </RadioGroup>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discount-value" className="text-right">
              Value
            </Label>
            <div className="col-span-3 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                {discountType === "percentage" ? (
                  <Percent className="h-4 w-4 text-gray-500" />
                ) : (
                  <DollarIcon className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <Input
                id="discount-value"
                type="number"
                step={discountType === "percentage" ? "1" : "0.01"}
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="pl-8"
                placeholder={discountType === "percentage" ? "10" : "5.00"}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApplyDiscount}>Apply Discount</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
