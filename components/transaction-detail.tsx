"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Printer, Edit } from "lucide-react"
import type { Transaction } from "@/types/pos-types"
import { formatCurrency } from "@/lib/utils"

interface TransactionDetailProps {
  transaction: Transaction
  onBack: () => void
  onEdit: (transaction: Transaction) => void
}

export default function TransactionDetail({ transaction, onBack, onEdit }: TransactionDetailProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className="bg-white shadow-md border border-gradient-primary">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-pink-50">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-0 hover:bg-transparent">
            <ArrowLeft className="h-5 w-5 mr-1" /> Back to Transactions
          </Button>
          <Badge
            className={
              transaction.isReturn
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            }
          >
            {transaction.isReturn ? "Return" : "Sale"}
          </Badge>
        </div>
        <CardTitle className="text-xl">Transaction {transaction.id}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-slate-500">Date & Time</div>
            <div>{new Date(transaction.timestamp).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Payment Method</div>
            <div className="capitalize">{transaction.paymentMethod}</div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h3 className="font-medium">Items</h3>
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 p-2 border-b border-slate-200 font-medium text-sm">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <div className="divide-y divide-slate-200">
              {transaction.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 p-2">
                  <div className="col-span-6">
                    <div>{item.product.name}</div>
                    <div className="text-xs text-slate-500">{item.product.category}</div>
                  </div>
                  <div className="col-span-2 text-right">{formatCurrency(item.product.price)}</div>
                  <div className="col-span-2 text-right">{item.quantity}</div>
                  <div className="col-span-2 text-right font-medium">
                    {formatCurrency(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
            <div className="flex justify-between mb-1">
              <span>Subtotal</span>
              <span>{formatCurrency(transaction.subtotal)}</span>
            </div>

            {transaction.discount && transaction.discountAmount && transaction.discountAmount > 0 && (
              <div className="flex justify-between mb-1 text-blue-600">
                <span>Discount ({transaction.discount.description})</span>
                <span>-{formatCurrency(transaction.discountAmount)}</span>
              </div>
            )}

            {transaction.taxApplied !== false && (
              <div className="flex justify-between mb-1">
                <span>Tax (13%)</span>
                <span>{formatCurrency(transaction.tax)}</span>
              </div>
            )}

            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total {transaction.isReturn ? "Refund" : ""}</span>
              <span>{formatCurrency(Math.abs(transaction.total))}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-slate-200 p-4">
        <Button variant="outline" onClick={handlePrint} className="border-slate-300 hover:bg-slate-50">
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button onClick={() => onEdit(transaction)} className="bg-blue-600 hover:bg-blue-700">
          <Edit className="mr-2 h-4 w-4" />
          Edit Transaction
        </Button>
      </CardFooter>
    </Card>
  )
}
