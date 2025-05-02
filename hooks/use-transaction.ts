"use client"

import { useState, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import { saveTransaction } from "@/services/transaction-service"
import { TAX_RATE } from "@/lib/constants"
import type { CartItem, Transaction, Discount } from "@/types/pos-types"

export function useTransaction() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [receipt, setReceipt] = useState<{
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
  } | null>(null)
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [discount, setDiscount] = useState<Discount | null>(null)

  const addToCart = useCallback((product: any, quantity = 1) => {
    if (quantity <= 0) return

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)

      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        return [...prevCart, { product, quantity }]
      }
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setDiscount(null)
  }, [])

  const toggleTax = useCallback(() => {
    setTaxEnabled((prev) => !prev)
  }, [])

  const applyDiscount = useCallback((newDiscount: Discount) => {
    setDiscount(newDiscount)
  }, [])

  const removeDiscount = useCallback(() => {
    setDiscount(null)
  }, [])

  const completeTransaction = useCallback(
    async (paymentMethod: string, isReturn = false, onSuccess?: (transaction: Transaction) => void) => {
      try {
        if (cart.length === 0) {
          throw new Error("Cart is empty")
        }

        const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

        // Calculate discount amount
        const discountAmount = discount
          ? discount.type === "percentage"
            ? (subtotal * discount.value) / 100
            : discount.value
          : 0

        // Calculate subtotal after discount
        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)

        // Calculate tax amount
        const tax = taxEnabled ? subtotalAfterDiscount * TAX_RATE : 0

        const total = subtotalAfterDiscount + tax

        const transactionId = `TX-${Date.now().toString().slice(-6)}`
        const timestamp = new Date()

        const newReceipt = {
          items: [...cart],
          subtotal,
          discount: discount || undefined,
          discountAmount: discountAmount || undefined,
          tax,
          total: isReturn ? -total : total,
          transactionId,
          timestamp,
          paymentMethod,
          isReturn,
          taxApplied: taxEnabled,
        }

        // Create transaction object - only include essential fields for database
        const newTransaction: Transaction = {
          id: transactionId,
          items: [...cart],
          subtotal,
          tax,
          total: isReturn ? -total : total,
          timestamp,
          paymentMethod,
          isReturn,
          taxApplied: taxEnabled,
        }

        // Save transaction to Supabase
        const success = await saveTransaction(newTransaction)

        if (success) {
          // Add discount information for UI
          const transactionWithDiscount = {
            ...newTransaction,
            discount: discount || undefined,
            discountAmount: discountAmount || undefined,
          }

          setReceipt(newReceipt)
          clearCart()

          if (onSuccess) {
            onSuccess(transactionWithDiscount)
          }

          return transactionWithDiscount
        } else {
          throw new Error("Failed to save transaction")
        }
      } catch (error) {
        console.error("Error completing transaction:", error)
        toast({
          title: "Error",
          description: "Failed to save transaction. Please try again.",
          variant: "destructive",
        })
        return null
      }
    },
    [cart, discount, taxEnabled, clearCart],
  )

  const resetTransaction = useCallback(() => {
    setReceipt(null)
    setDiscount(null)
    setTaxEnabled(true)
  }, [])

  return {
    cart,
    receipt,
    taxEnabled,
    discount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleTax,
    applyDiscount,
    removeDiscount,
    completeTransaction,
    resetTransaction,
  }
}
