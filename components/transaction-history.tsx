"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Edit, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getRecentTransactions } from "@/services/transaction-service"
import type { Transaction } from "@/types/pos-types"
import { formatCurrency } from "@/lib/utils"

interface TransactionHistoryProps {
  onSelectTransaction: (transaction: Transaction) => void
  onEditTransaction: (transaction: Transaction) => void
}

export default function TransactionHistory({ onSelectTransaction, onEditTransaction }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadTransactions() {
      setIsLoading(true)
      try {
        const recentTransactions = await getRecentTransactions(10)
        setTransactions(recentTransactions)
      } catch (error) {
        console.error("Failed to load transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="bg-white shadow-md border border-gradient-primary">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-pink-50">
        <CardTitle className="text-xl">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
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
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border border-slate-200 rounded-md p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{transaction.id}</div>
                    <div className="text-sm text-slate-500">{new Date(transaction.timestamp).toLocaleString()}</div>
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
                      onClick={() => onSelectTransaction(transaction)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={() => onEditTransaction(transaction)}
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
      </CardContent>
    </Card>
  )
}
