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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CartItem } from "@/types/pos-types"

interface ShoppingCartProps {
  cart: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onCheckout: (paymentMethod: string, isReturn: boolean) => void
  onOpenManualEntry: () => void
}

export default function ShoppingCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onOpenManualEntry,
}: ShoppingCartProps) {
  const [transactionType, setTransactionType] = useState<"sale" | "return">("sale")
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.08 // 8% tax rate
  const total = subtotal + tax

  return (
    <Card className="bg-white shadow-md border border-slate-200 h-full">
      <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <CartIcon className="mr-2 h-5 w-5" />
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

        {/* Totals and checkout */}
        <div className="mt-auto">
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between">
              <span className="text-sm">Subtotal</span>
              <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tax (8%)</span>
              <span className="text-sm font-medium">${tax.toFixed(2)}</span>
            </div>
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
