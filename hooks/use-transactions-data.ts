"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Transaction } from "@/types/pos-types"
import { getFromStorage, setToStorage } from "@/lib/utils"
import { STORAGE_KEYS } from "@/lib/constants"

export function useTransactionsData() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load transactions from localStorage on mount
  useEffect(() => {
    try {
      const savedTransactions = getFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, [])
      // Convert timestamp strings back to Date objects
      const parsedTransactions = savedTransactions.map((transaction) => ({
        ...transaction,
        timestamp: new Date(transaction.timestamp),
        items: transaction.items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            createdAt: new Date(item.product.createdAt),
            updatedAt: new Date(item.product.updatedAt),
          },
        })),
      }))
      setTransactions(parsedTransactions)
    } catch (error) {
      console.error("Failed to load transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions)
      } catch (error) {
        console.error("Failed to save transactions:", error)
      }
    }
  }, [transactions, isLoading])

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev])
    toast({
      title: "Transaction Saved",
      description: `Transaction ${transaction.id} has been saved successfully`,
    })
  }, [])

  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    setTransactions((prev) =>
      prev.map((transaction) => (transaction.id === updatedTransaction.id ? updatedTransaction : transaction)),
    )
    toast({
      title: "Transaction Updated",
      description: `Transaction ${updatedTransaction.id} has been updated`,
    })
  }, [])

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== transactionId))
    toast({
      title: "Transaction Deleted",
      description: "Transaction has been deleted successfully",
    })
  }, [])

  const getTransactionById = useCallback(
    (id: string): Transaction | undefined => {
      return transactions.find((transaction) => transaction.id === id)
    },
    [transactions],
  )

  const getRecentTransactions = useCallback(
    (limit = 10): Transaction[] => {
      return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
    },
    [transactions],
  )

  const clearAllTransactions = useCallback(() => {
    setTransactions([])
    toast({
      title: "Transactions Cleared",
      description: "All transaction history has been cleared",
    })
  }, [])

  return {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getRecentTransactions,
    clearAllTransactions,
  }
}

export default useTransactionsData
