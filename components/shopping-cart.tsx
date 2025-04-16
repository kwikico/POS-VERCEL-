"use client"

import { useState } from "react"
import {
  Minus,
  Plus,
  ShoppingCartIcon as CartIcon,
  Trash2,
  CreditCard,
  DollarSign,
  RotateCcw,
  PlusIcon,
  Percent,
  DollarSignIcon as DollarIcon,
  ToggleLeft,
  ToggleRight,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { CartItem, Discount } from "@/types/pos-types"

interface ShoppingCartProps {
  cart: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onCheckout: (paymentMethod: string, isReturn: boolean) => void
  onOpenManualEntry: () => void
  taxEnabled: boolean
  onTaxToggle: () => void
  discount: Discount | null
  onApplyDiscount: (discount: Discount) => void
  onRemoveDiscount: () => void
}

export default function ShoppingCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onOpenManualEntry,
  taxEnabled,
  onTaxToggle,
  discount,
  onApplyDiscount,
  onRemoveDiscount,
}: ShoppingCartProps) {
  const [transactionType, setTransactionType] = useState<"sale" | "return">("sale")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<string>("")
  const [isDiscountOpen, setIsDiscountOpen] = useState<boolean>(false)

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Calculate discount amount
  const discountAmount = discount
    ? discount.type === "percentage"
      ? (subtotal * discount.value) / 100
      : discount.value
    : 0

  // Calculate subtotal after discount
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)

  // Calculate tax only if enabled
  const tax = taxEnabled ? subtotalAfterDiscount * 0.13 : 0 // 13% tax rate for Toronto
  const total = subtotalAfterDiscount + tax

  const handleApplyDiscount = () => {
    const parsedValue = Number.parseFloat(discountValue)
    if (!isNaN(parsedValue) && parsedValue > 0) {
      onApplyDiscount({
        type: discountType,
        value: parsedValue,
        description: `${discountType === "percentage" ? parsedValue + "%" : "$" + parsedValue.toFixed(2)} discount`,
      })
      setDiscountValue("")
      setIsDiscountOpen(false)
    }
  }

  return (
    <Card className="bg-white shadow-md border border-gradient-primary h-full">
      <CardHeader className="pb-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-pink-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <div className="bg-white rounded-full p-1 shadow-sm mr-2">
              <CartIcon className="h-5 w-5 text-blue-600" />
            </div>
            Cart
          </CardTitle>
          <span className="text-sm text-gray-500">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col h-[calc(100%-60px)]">
        <Tabs
          value={transactionType}
          onValueChange={(value) => setTransactionType(value as "sale" | "return")}
          className="mb-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sale">Sale</TabsTrigger>
            <TabsTrigger value="return">Return</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          className="w-full mb-3 border-slate-300 bg-slate-50 hover:bg-slate-100"
          onClick={onOpenManualEntry}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Manual Item
        </Button>

        {/* Cart items - scrollable */}
        <div className="flex-grow overflow-y-auto border border-slate-200 rounded-md mb-3 min-h-[200px]">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Your cart is empty</div>
          ) : (
            <div className="divide-y">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 border-b border-slate-100"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-md bg-gray-100 overflow-hidden">
                      <img
                        src={item.product.imageUrl || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-sm truncate max-w-[120px]">{item.product.name}</div>
                      <div className="text-xs text-gray-500">${item.product.price.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="text-sm font-medium mr-1">${(item.product.price * item.quantity).toFixed(2)}</div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 border-slate-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateQuantity(item.product.id, item.quantity - 1)
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 border-slate-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateQuantity(item.product.id, item.quantity + 1)
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveItem(item.product.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discount UI */}
        {!isDiscountOpen ? (
          <div className="mb-2">
            {discount ? (
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md mb-2">
                <div>
                  <span className="text-sm font-medium flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-blue-600" />
                    {discount.description}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRemoveDiscount}>
                  <Trash2 className="h-4 w-4 text-blue-600" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600"
                onClick={() => setIsDiscountOpen(true)}
              >
                <Tag className="h-4 w-4 mr-2" />
                Add Discount
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 p-3 rounded-md mb-2">
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
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsDiscountOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleApplyDiscount}>
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Tax Toggle */}
        <div className="flex justify-between items-center mb-2 p-2 bg-slate-50 rounded-md">
          <span className="text-sm font-medium">Apply 13% Tax</span>
          <Button variant="ghost" size="sm" className="p-0 m-0 hover:bg-transparent" onClick={onTaxToggle}>
            {taxEnabled ? (
              <ToggleRight className="h-6 w-6 text-blue-500" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-gray-400" />
            )}
          </Button>
        </div>

        {/* Totals and checkout */}
        <div className="mt-auto">
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between">
              <span className="text-sm">Subtotal</span>
              <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
            </div>

            {discount && discountAmount > 0 && (
              <div className="flex justify-between text-blue-600">
                <span className="text-sm">Discount</span>
                <span className="text-sm font-medium">-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            {taxEnabled && (
              <div className="flex justify-between">
                <span className="text-sm">Tax (13%)</span>
                <span className="text-sm font-medium">${tax.toFixed(2)}</span>
              </div>
            )}

            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => onCheckout("card", transactionType === "return")}
              disabled={cart.length === 0}
              className={
                transactionType === "return" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {transactionType === "sale" ? "Card" : "Return Card"}
            </Button>
            <Button
              onClick={() => onCheckout("cash", transactionType === "return")}
              disabled={cart.length === 0}
              className={
                transactionType === "return" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              <DollarSign className="mr-2 h-4 w-4" />
              {transactionType === "sale" ? "Cash" : "Return Cash"}
            </Button>
            <Button variant="outline" className="w-full col-span-2 border-slate-300" onClick={onClearCart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
