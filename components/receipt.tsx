"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Printer,
  RotateCcw,
  Search,
  Eye,
  Edit,
  Loader2,
  ArrowLeft,
  Save,
  X,
  Minus,
  Plus,
  Trash2,
  ListIcon,
  ShoppingCart,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { CartItem, Transaction, Discount } from "@/types/pos-types"
import { formatCurrency } from "@/lib/utils"
import { getRecentTransactions, updateTransaction } from "@/services/transaction-service"
import { toast } from "@/components/ui/use-toast"

interface ReceiptProps {
  receipt: {
    items: CartItem[]
    subtotal: number
    discountAmount?: number
    discount?: Discount
    tax: number
    total: number
    transactionId: string
    timestamp: Date
    paymentMethod: string
    isReturn: boolean
    taxApplied: boolean
  }
  onStartNewTransaction: () => void
}

export default function Receipt({ receipt, onStartNewTransaction }: ReceiptProps) {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTransaction, setEditedTransaction] = useState<Transaction | null>(null)
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  // Load recent transactions
  useEffect(() => {
    if (activeTab === "history" && transactions.length === 0) {
      loadTransactions()
    }
  }, [activeTab])

  const loadTransactions = async () => {
    setIsLoading(true)
    try {
      const recentTransactions = await getRecentTransactions(10)
      setTransactions(recentTransactions)
    } catch (error) {
      console.error("Failed to load transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transaction history.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSelectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setEditedTransaction(null)
    setIsEditing(false)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setEditedTransaction({ ...transaction })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTransaction(null)
  }

  const handleBackToList = () => {
    setSelectedTransaction(null)
    setEditedTransaction(null)
    setIsEditing(false)
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (!editedTransaction) return

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
    if (!editedTransaction) return

    setEditedTransaction({
      ...editedTransaction,
      items: editedTransaction.items.filter((item) => item.product.id !== productId),
    })
  }

  const handleToggleTax = () => {
    if (!editedTransaction) return

    setEditedTransaction({
      ...editedTransaction,
      taxApplied: !editedTransaction.taxApplied,
    })
  }

  const handleApplyDiscount = () => {
    if (!editedTransaction) return

    const parsedValue = Number.parseFloat(discountValue)
    if (!isNaN(parsedValue) && parsedValue > 0) {
      const subtotal = editedTransaction.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

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
      setDiscountValue("")
    }
  }

  const handleRemoveDiscount = () => {
    if (!editedTransaction) return

    setEditedTransaction({
      ...editedTransaction,
      discount: undefined,
      discountAmount: undefined,
    })
  }

  const handleSaveTransaction = async () => {
    if (!editedTransaction) return

    setIsSaving(true)

    try {
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

      const updatedTransaction = {
        ...editedTransaction,
        subtotal,
        discountAmount,
        tax,
        total: editedTransaction.isReturn ? -total : total,
      }

      const success = await updateTransaction(updatedTransaction)

      if (success) {
        toast({
          title: "Transaction Updated",
          description: `Transaction ${updatedTransaction.id} has been updated successfully.`,
        })

        // Update the transaction in the list
        setTransactions(transactions.map((tx) => (tx.id === updatedTransaction.id ? updatedTransaction : tx)))

        setSelectedTransaction(updatedTransaction)
        setIsEditing(false)
        setEditedTransaction(null)
      } else {
        throw new Error("Failed to update transaction")
      }
    } catch (error) {
      console.error("Error updating transaction:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewHistory = () => {
    setActiveTab("history")
  }

  // Convert the receipt to a Transaction object for consistency
  const receiptAsTransaction: Transaction = {
    id: receipt.transactionId,
    items: receipt.items,
    subtotal: receipt.subtotal,
    discount: receipt.discount,
    discountAmount: receipt.discountAmount,
    tax: receipt.tax,
    total: receipt.total,
    timestamp: receipt.timestamp,
    paymentMethod: receipt.paymentMethod,
    isReturn: receipt.isReturn,
    taxApplied: receipt.taxApplied,
  }

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculate totals for edited transaction
  const calculateTotals = () => {
    if (!editedTransaction) return { subtotal: 0, discountAmount: 0, tax: 0, total: 0 }

    const subtotal = editedTransaction.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    const discountAmount = editedTransaction.discount
      ? editedTransaction.discount.type === "percentage"
        ? (subtotal * editedTransaction.discount.value) / 100
        : editedTransaction.discount.value
      : 0

    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)

    const tax = editedTransaction.taxApplied ? subtotalAfterDiscount * 0.13 : 0

    const total = subtotalAfterDiscount + tax

    return { subtotal, discountAmount, tax, total }
  }

  const { subtotal, discountAmount, tax, total } = editedTransaction
    ? calculateTotals()
    : { subtotal: 0, discountAmount: 0, tax: 0, total: 0 }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-white shadow-md border border-gradient-primary">
        <CardHeader className="text-center border-b border-slate-200 pb-6 bg-gradient-to-r from-blue-50 to-pink-50">
          <div className="flex justify-between items-center mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewHistory}
              className="border-slate-300 hover:bg-slate-50"
            >
              <ListIcon className="mr-2 h-4 w-4" />
              Transaction History
            </Button>
            <Badge
              className={
                receipt.isReturn
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              }
            >
              {receipt.isReturn ? "RETURN" : "SALE"}
            </Badge>
          </div>
          <div className="flex justify-center items-center mb-2">
            <div className="bg-white rounded-full p-2 shadow-md mr-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">KWIKI CONVENIENCE</CardTitle>
          </div>
          <p className="text-sm text-gray-500">966 ST CLAIR AVE WEST, TORONTO, CANADA</p>
          <p className="text-sm text-gray-500">Tel: (555) 123-4567</p>
          <p className="text-sm text-gray-500">KWIKI.CA</p>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "current" | "history")}>
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current Receipt</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="current" className="p-0">
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
                {receipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        x{item.quantity} @ {formatCurrency(item.product.price)}
                      </span>
                    </div>
                    <span>{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Math.abs(receipt.subtotal))}</span>
                </div>

                {receipt.discount && receipt.discountAmount && receipt.discountAmount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>{receipt.discount.description}</span>
                    <span>-{formatCurrency(Math.abs(receipt.discountAmount))}</span>
                  </div>
                )}

                {receipt.taxApplied && (
                  <div className="flex justify-between">
                    <span>Tax (13%)</span>
                    <span>{formatCurrency(Math.abs(receipt.tax))}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold pt-2">
                  <span>Total {receipt.isReturn ? "Refund" : ""}</span>
                  <span>{formatCurrency(Math.abs(receipt.total))}</span>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>THANK YOU FOR SHOPPING LOCAL!</p>
                <p>PROUD CANADIAN BUSINESS</p>
                <p>KWIKI.CA</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-200">
              <Button variant="outline" onClick={handlePrint} className="border-slate-300 hover:bg-slate-50">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={onStartNewTransaction} className="bg-emerald-600 hover:bg-emerald-700">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Transaction
              </Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="history" className="p-0">
            <CardContent className="pt-6">
              {!selectedTransaction ? (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="search"
                      placeholder="Search by transaction ID or payment method..."
                      className="pl-8 border-slate-300 focus:border-slate-400 focus:ring-slate-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                      <span className="ml-2 text-slate-500">Loading transactions...</span>
                    </div>
                  ) : filteredTransactions.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {filteredTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="border border-slate-200 rounded-md p-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">{transaction.id}</div>
                              <div className="text-sm text-slate-500">
                                {new Date(transaction.timestamp).toLocaleString()}
                              </div>
                            </div>
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
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm">
                                <span className="text-slate-500">Items:</span> {transaction.items.length}
                              </div>
                              <div className="text-sm">
                                <span className="text-slate-500">Total:</span>{" "}
                                <span className="font-medium">{formatCurrency(Math.abs(transaction.total))}</span>
                              </div>
                              <div className="text-sm capitalize">
                                <span className="text-slate-500">Payment:</span> {transaction.paymentMethod}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-300"
                                onClick={() => handleSelectTransaction(transaction)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? "No transactions match your search" : "No recent transactions found"}
                    </div>
                  )}
                </>
              ) : isEditing && editedTransaction ? (
                // Edit Transaction View
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="p-0 hover:bg-transparent">
                      <ArrowLeft className="h-5 w-5 mr-1" /> Back to Details
                    </Button>
                    <h3 className="font-medium">Edit Transaction {editedTransaction.id}</h3>
                  </div>

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
                      <Switch
                        id="tax-applied"
                        checked={editedTransaction.taxApplied}
                        onCheckedChange={handleToggleTax}
                      />
                      <Label htmlFor="tax-applied">Apply 13% Tax</Label>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <h3 className="font-medium">Items</h3>

                    <div className="border border-slate-200 rounded-md overflow-hidden">
                      <div className="grid grid-cols-12 bg-slate-50 p-2 border-b border-slate-200 font-medium text-sm">
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-right">Price</div>
                        <div className="col-span-3 text-center">Quantity</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      <div className="divide-y divide-slate-200 max-h-[200px] overflow-y-auto">
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
                                <X className="h-3 w-3" />
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

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handleCancelEdit} className="border-slate-300 hover:bg-slate-50">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTransaction}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // Transaction Detail View
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={handleBackToList} className="p-0 hover:bg-transparent">
                      <ArrowLeft className="h-5 w-5 mr-1" /> Back to Transactions
                    </Button>
                    <Badge
                      className={
                        selectedTransaction.isReturn
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      }
                    >
                      {selectedTransaction.isReturn ? "Return" : "Sale"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-slate-500">Date & Time</div>
                      <div>{new Date(selectedTransaction.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Payment Method</div>
                      <div className="capitalize">{selectedTransaction.paymentMethod}</div>
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
                      <div className="divide-y divide-slate-200 max-h-[200px] overflow-y-auto">
                        {selectedTransaction.items.map((item, index) => (
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
                        <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                      </div>

                      {selectedTransaction.discount &&
                        selectedTransaction.discountAmount &&
                        selectedTransaction.discountAmount > 0 && (
                          <div className="flex justify-between mb-1 text-blue-600">
                            <span>Discount ({selectedTransaction.discount.description})</span>
                            <span>-{formatCurrency(selectedTransaction.discountAmount)}</span>
                          </div>
                        )}

                      {selectedTransaction.taxApplied !== false && (
                        <div className="flex justify-between mb-1">
                          <span>Tax (13%)</span>
                          <span>{formatCurrency(selectedTransaction.tax)}</span>
                        </div>
                      )}

                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total {selectedTransaction.isReturn ? "Refund" : ""}</span>
                        <span>{formatCurrency(Math.abs(selectedTransaction.total))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handlePrint} className="border-slate-300 hover:bg-slate-50">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Button>
                    <Button
                      onClick={() => handleEditTransaction(selectedTransaction)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Transaction
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setActiveTab("current")}
                className="border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Receipt
              </Button>
              <Button onClick={onStartNewTransaction} className="bg-emerald-600 hover:bg-emerald-700">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Transaction
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
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
    </div>
  )
}
