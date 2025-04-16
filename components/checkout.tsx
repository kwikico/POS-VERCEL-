"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CartItem } from "@/types/pos-types"
import { CreditCard, DollarSign, Smartphone } from "lucide-react"

interface CheckoutProps {
  cart: CartItem[]
  subtotal: number
  tax: number
  total: number
  onCompleteTransaction: () => void
  onCancel: () => void
}

export default function Checkout({ cart, subtotal, tax, total, onCompleteTransaction, onCancel }: CheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      onCompleteTransaction()
    }, 1500)
  }

  return (
    <Card className="max-w-md mx-auto bg-white shadow-md border border-slate-200">
      <CardHeader className="border-b border-slate-200 bg-slate-50">
        <CardTitle>Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-md">
            <TabsTrigger
              value="card"
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Card
            </TabsTrigger>
            <TabsTrigger
              value="cash"
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Cash
            </TabsTrigger>
            <TabsTrigger
              value="mobile"
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4 mt-4">
            <div className="text-center p-4 border border-slate-200 rounded-md bg-slate-50">
              <p className="text-sm text-slate-500 mb-2">Card payment terminal would be integrated here</p>
              <p className="font-medium text-slate-800">Amount: ${total.toFixed(2)}</p>
            </div>
          </TabsContent>

          <TabsContent value="cash" className="space-y-4 mt-4">
            <div className="text-center p-4 border border-slate-200 rounded-md bg-slate-50">
              <p className="text-sm text-slate-500 mb-2">Cash drawer integration would be here</p>
              <p className="font-medium text-slate-800">Amount due: ${total.toFixed(2)}</p>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4 mt-4">
            <div className="text-center p-4 border border-slate-200 rounded-md bg-slate-50">
              <p className="text-sm text-slate-500 mb-2">Mobile payment QR code would be displayed here</p>
              <p className="font-medium text-slate-800">Amount: ${total.toFixed(2)}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} className="border-slate-300 hover:bg-slate-50">
          Cancel
        </Button>
        <Button onClick={handlePayment} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
          {isProcessing ? "Processing..." : "Complete Payment"}
        </Button>
      </CardFooter>
    </Card>
  )
}
