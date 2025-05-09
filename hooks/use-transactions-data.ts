"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { getTransactions } from "@/services/transaction-service"
import type { Transaction } from "@/types/pos-types"

export function useTransactionsData() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load transactions from Supabase on initial render
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // Load transactions from Supabase
        const { data: fetchedTransactions, error } = await getTransactions()

        if (error) {
          setError(error.message)
          toast({
            title: "Warning",
            description: error.message,
            variant: "destructive",
          })
        }

        // Ensure we always set an array, even if fetchedTransactions is null or undefined
        setTransactions(Array.isArray(fetchedTransactions) ? fetchedTransactions : [])
      } catch (error) {
        console.error("Unexpected error in useTransactionsData:", error)
        setError("An unexpected error occurred while loading transaction history")

        toast({
          title: "Error",
          description: "Failed to load transaction history.",
          variant: "destructive",
        })

        // Ensure we reset to an empty array in case of error
        setTransactions([])
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
    error,
    addTransaction,
  }
}
