"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { Transaction, Discount } from "@/types/pos-types"
import { formatCurrency } from "@/lib/utils"

interface TransactionEditProps {
  transaction: Transaction
  onBack: () => void
  onSave: (updatedTransaction: Transaction) => Promise<boolean>
  onCancel: () => void
}

export default function TransactionEdit({ transaction, onBack, onSave, onCancel }: TransactionEditProps) {
  const [editedTransaction, setEditedTransaction] = useState<Transaction>({ ...transaction })
  const [isLoading, setIsLoading] = useState(false)
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    editedTransaction.discount?.type || "percentage",
  )
  const [discountValue, setDiscountValue] = useState<string>(
    editedTransaction.discount?.value ? String(editedTransaction.discount.value) : "",
  )

  // Calculate totals
  const subtotal = editedTransaction.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Calculate discount amount
  const discountAmount = editedTransaction.discount
    ? editedTransaction.discount.type === "percentage"
      ? (subtotal * editedTransaction.discount.value) / 100
      : editedTransaction.discount.value
    : 0

  // Calculate subtotal after discount
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)

  // Calculate tax
  const tax = editedTransaction.taxApplied ? subtotalAfterDiscount * 0.13 : 0

  // Calculate total
  const total = subtotalAfterDiscount + tax

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setEditedTransaction({
        ...editedTransaction,
        items: editedTransaction.items.filter((item) => item.product.id !== productId),
      })
    } else {
      // Update quantity
      setEditedTransaction({
        ...editedTransaction,
        items: editedTransaction.items.map((item) =>
          item.product.id === productId ? { ...item, quantity: newQuantity } : item,
        ),
      })
    }
  }

  const handleRemoveItem = (productId: string) => {
    setEditedTransaction({
      ...editedTransaction,
      items: editedTransaction.items.filter((item) => item.product.id !== productId),
    })
  }

  const handleToggleTax = () => {
    setEditedTransaction({
      ...editedTransaction,
      taxApplied: !editedTransaction.taxApplied,
    })
  }

  const handleApplyDiscount = () => {
    const parsedValue = Number.parseFloat(discountValue)
    if (!isNaN(parsedValue) && parsedValue > 0) {
      const newDiscount: Discount = {
        type: discountType,
        value: parsedValue,
        description: `${discountType === "percentage" ? parsedValue + "%" : "$" + parsedValue.toFixed(2)} discount`,
      }

      setEditedTransaction({
        ...editedTransaction,
        discount: newDiscount,
        discountAmount: discountType === "percentage" ? (subtotal * parsedValue) / 100 : parsedValue,
      })

      setIsDiscountDialogOpen(false)
    }
  }

  const handleRemoveDiscount = () => {
    setEditedTransaction({
      ...editedTransaction,
      discount: undefined,
      discountAmount: undefined,
    })
  }

  const handleSave = async () => {
    setIsLoading(true)

    // Update the total based on current calculations
    const updatedTransaction = {
      ...editedTransaction,
      subtotal,
      discountAmount,
      tax,
      total: editedTransaction.isReturn ? -total : total,
    }

    try {
      const success = await onSave(updatedTransaction)
      if (success) {
        onBack()
      }
    } catch (error) {
      console.error("Failed to save transaction:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="bg-white shadow-md border border-gradient-primary">
        <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-pink-50">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-0 hover:bg-transparent">
              <ArrowLeft className="h-5 w-5 mr-1" /> Back
            </Button>
          </div>
          <CardTitle className="text-xl">Edit Transaction {editedTransaction.id}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="transaction-date">Date & Time</Label>
              <Input
                id="transaction-date"
                type="datetime-local"
                value={new Date(editedTransaction.timestamp).toISOString().slice(0, 16)}
                onChange={(e) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    timestamp: new Date(e.target.value),
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                value={editedTransaction.paymentMethod}
                onValueChange={(value) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    paymentMethod: value,
                  })
                }
              >
                <SelectTrigger id="payment-method" className="mt-1">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="transaction-type"
                checked={editedTransaction.isReturn}
                onCheckedChange={(checked) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    isReturn: checked,
                  })
                }
              />
              <Label htmlFor="transaction-type">Return Transaction</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="tax-applied" checked={editedTransaction.taxApplied} onCheckedChange={handleToggleTax} />
              <Label htmlFor="tax-applied">Apply 13% Tax</Label>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Items</h3>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => {
                  /* Add item functionality would go here */
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-50 p-2 border-b border-slate-200 font-medium text-sm">
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-slate-200">
                {editedTransaction.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 p-2 items-center">
                    <div className="col-span-5">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-slate-500">{item.product.category}</div>
                    </div>
                    <div className="col-span-2 text-right">{formatCurrency(item.product.price)}</div>
                    <div className="col-span-3 flex items-center justify-center space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 border-slate-300"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 border-slate-300"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="col-span-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleRemoveItem(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <div className="flex justify-between mb-1">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between mb-1 items-center">
                <span>Discount</span>
                <div className="flex items-center">
                  {editedTransaction.discount ? (
                    <>
                      <span className="text-blue-600 mr-2">
                        -{formatCurrency(discountAmount)} ({editedTransaction.discount.description})
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:bg-red-50"
                        onClick={handleRemoveDiscount}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => setIsDiscountDialogOpen(true)}
                    >
                      Add Discount
                    </Button>
                  )}
                </div>
              </div>

              {editedTransaction.taxApplied && (
                <div className="flex justify-between mb-1">
                  <span>Tax (13%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              )}

              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total {editedTransaction.isReturn ? "Refund" : ""}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-200 p-4">
          <Button variant="outline" onClick={onCancel} className="border-slate-300 hover:bg-slate-50">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
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
              <Input
                id="discount-value"
                type="number"
                step={discountType === "percentage" ? "1" : "0.01"}
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="col-span-3"
                placeholder={discountType === "percentage" ? "10" : "5.00"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyDiscount}>Apply Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
