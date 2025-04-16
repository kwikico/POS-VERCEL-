"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { CartItem } from "@/types/pos-types"
import { Printer, RotateCcw } from "lucide-react"

interface ReceiptProps {
  receipt: {
    items: CartItem[]
    subtotal: number
    tax: number
    total: number
    transactionId: string
    timestamp: Date
    paymentMethod: string
    isReturn: boolean
  }
  onStartNewTransaction: () => void
}

export default function Receipt({ receipt, onStartNewTransaction }: ReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="receipt-card bg-white shadow-md border border-slate-200">
        <CardHeader className="text-center border-b border-slate-200 pb-6 bg-slate-50">
          <CardTitle className="text-xl">QuickServe Market</CardTitle>
          <p className="text-sm text-gray-500">123 Main Street, Anytown, USA</p>
          <p className="text-sm text-gray-500">Tel: (555) 123-4567</p>
          <div className="mt-2 text-lg font-bold">
            {receipt.isReturn ? (
              <span className="text-amber-600">RETURN</span>
            ) : (
              <span className="text-emerald-600">SALE</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm mb-4">
            <span>Transaction #: {receipt.transactionId}</span>
            <span>{receipt.timestamp.toLocaleString()}</span>
          </div>
          <div className="text-sm mb-4">
            <span>Payment Method: {receipt.paymentMethod.toUpperCase()}</span>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            {receipt.items.map((item) => (
              <div key={item.product.id} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    x{item.quantity} @ ${item.product.price.toFixed(2)}
                  </span>
                </div>
                <span>${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${Math.abs(receipt.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%)</span>
              <span>${Math.abs(receipt.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2">
              <span>Total {receipt.isReturn ? "Refund" : ""}</span>
              <span>${Math.abs(receipt.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Thank you for shopping with us!</p>
            <p>Please come again</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrint} className="border-slate-300 hover:bg-slate-50">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={onStartNewTransaction} className="bg-emerald-600 hover:bg-emerald-700">
            <RotateCcw className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
