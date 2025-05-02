"use client"

import { useState, memo, useCallback, useMemo } from "react"
import {
  ShoppingCartIcon as CartIcon,
  CreditCard,
  DollarSign,
  RotateCcw,
  PlusIcon,
  ToggleLeft,
  ToggleRight,
  Tag,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CartItem } from "@/components/shopping-cart/cart-item"
import { DiscountForm } from "@/components/shopping-cart/discount-form"
import { CartSummary } from "@/components/shopping-cart/cart-summary"
import { TAX_RATE } from "@/lib/constants"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import type { CartItem as CartItemType, Discount } from "@/types/pos-types"

interface ShoppingCartProps {
  cart: CartItemType[]
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

function ShoppingCartComponent({
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
  const [isDiscountOpen, setIsDiscountOpen] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Calculate cart totals with memoization
  const cartTotals = useMemo(() => {
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
    const tax = taxEnabled ? subtotalAfterDiscount * TAX_RATE : 0
    const total = subtotalAfterDiscount + tax

    return {
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      tax,
      total,
    }
  }, [cart, discount, taxEnabled])

  // Handle keyboard shortcuts
  useKeyboardShortcut(
    {
      p: () => handleCheckout("card"),
      o: () => handleCheckout("cash"),
      t: onTaxToggle,
      d: () => {
        if (discount) {
          onRemoveDiscount()
        } else {
          setIsDiscountOpen(true)
        }
      },
    },
    [discount, onRemoveDiscount, onTaxToggle, cart.length],
  )

  // Handle checkout with specified payment method
  const handleCheckout = useCallback(
    async (paymentMethod: string) => {
      if (cart.length > 0 && !isProcessing) {
        setIsProcessing(true)
        try {
          await onCheckout(paymentMethod, transactionType === "return")
        } finally {
          setIsProcessing(false)
        }
      }
    },
    [cart.length, onCheckout, transactionType, isProcessing],
  )

  // Handle discount application
  const handleApplyDiscount = useCallback(
    (newDiscount: Discount) => {
      onApplyDiscount(newDiscount)
      setIsDiscountOpen(false)
    },
    [onApplyDiscount],
  )

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
          Add Manual Item <span className="ml-1 text-xs text-slate-400">(N)</span>
        </Button>

        {/* Cart items - scrollable */}
        <div className="flex-grow overflow-y-auto border border-slate-200 rounded-md mb-3 min-h-[200px]">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Your cart is empty</div>
          ) : (
            <div className="divide-y">
              {cart.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                />
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
                <div className="flex items-center">
                  <span className="text-xs text-slate-500 mr-1">(D)</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRemoveDiscount}>
                    <Trash2 className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600"
                onClick={() => setIsDiscountOpen(true)}
              >
                <Tag className="h-4 w-4 mr-2" />
                Add Discount <span className="ml-1 text-xs text-slate-400">(D)</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="mb-2">
            <DiscountForm onApply={handleApplyDiscount} onCancel={() => setIsDiscountOpen(false)} />
          </div>
        )}

        {/* Tax Toggle */}
        <div className="flex justify-between items-center mb-2 p-2 bg-slate-50 rounded-md">
          <span className="text-sm font-medium flex items-center">
            Apply 13% Tax <span className="ml-1 text-xs text-slate-400">(T)</span>
          </span>
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
          <CartSummary
            subtotal={cartTotals.subtotal}
            discount={discount}
            discountAmount={cartTotals.discountAmount}
            taxEnabled={taxEnabled}
            tax={cartTotals.tax}
            total={cartTotals.total}
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleCheckout("card")}
              disabled={cart.length === 0 || isProcessing}
              className={
                transactionType === "return" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {transactionType === "sale" ? "Card" : "Return Card"}
              <span className="ml-1 text-xs opacity-75">(P)</span>
            </Button>
            <Button
              onClick={() => handleCheckout("cash")}
              disabled={cart.length === 0 || isProcessing}
              className={
                transactionType === "return" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="mr-2 h-4 w-4" />
              )}
              {transactionType === "sale" ? "Cash" : "Return Cash"}
              <span className="ml-1 text-xs opacity-75">(O)</span>
            </Button>
            <Button variant="outline" className="w-full col-span-2 border-slate-300" onClick={onClearCart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Cart
              <span className="ml-1 text-xs text-slate-400">(C)</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Use memo to prevent unnecessary re-renders
export default memo(ShoppingCartComponent)
