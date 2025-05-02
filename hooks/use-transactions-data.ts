"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { getTransactions } from "@/services/transaction-service"
import type { Transaction } from "@/types/pos-types"

export function useTransactionsData() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load transactions from Supabase on initial render
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Load transactions from Supabase
        const fetchedTransactions = await getTransactions()
        setTransactions(fetchedTransactions)
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

    loadData()
  }, [])

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev])
  }

  return {
    transactions,
    isLoading,
    addTransaction,
  }
}
