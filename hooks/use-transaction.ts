"use client"

import { useState, useCallback, useMemo } from "react"
import { toast } from "@/components/ui/use-toast"
import { APP_CONFIG } from "@/lib/constants"
import { calculateSubtotal, calculateTax, calculateTotal, calculateDiscount, generateId } from "@/lib/utils"
import { validateDiscountApplication } from "@/lib/validation"
import type { CartItem, Product, Discount, Transaction, PaymentMethod, TransactionTotals } from "@/types/pos-types"

interface UseTransactionOptions {
  initialTaxEnabled?: boolean
  onTransactionComplete?: (transaction: Transaction) => void
  onError?: (error: string) => void
}

export function useTransaction(options: UseTransactionOptions = {}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [receipt, setReceipt] = useState<Transaction | null>(null)
  const [taxEnabled, setTaxEnabled] = useState(options.initialTaxEnabled ?? true)

  // Calculate totals
  const totals = useMemo((): TransactionTotals => {
    const subtotal = calculateSubtotal(cart)

    let discountAmount = 0
    if (discount && validateDiscountApplication(subtotal, discount)) {
      discountAmount = calculateDiscount(subtotal, discount.type, discount.value)
    }

    const tax = taxEnabled ? calculateTax(subtotal - discountAmount) : 0
    const total = calculateTotal(subtotal, tax, discountAmount)

    return {
      subtotal,
      discountAmount,
      tax,
      total,
    }
  }, [cart, discount, taxEnabled])

  // Add product to cart
  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (quantity <= 0) {
        toast({
          title: "Invalid Quantity",
          description: "Quantity must be greater than 0",
          variant: "destructive",
        })
        return
      }

      if (cart.length >= APP_CONFIG.BUSINESS.MAX_CART_ITEMS) {
        toast({
          title: "Cart Full",
          description: `Maximum ${APP_CONFIG.BUSINESS.MAX_CART_ITEMS} items allowed in cart`,
          variant: "destructive",
        })
        return
      }

      // Check stock availability
      if (product.stock !== undefined && product.stock < quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} items available`,
          variant: "destructive",
        })
        return
      }

      setCart((prevCart) => {
        const existingItemIndex = prevCart.findIndex((item) => item.product.id === product.id)

        if (existingItemIndex >= 0) {
          // Update existing item
          const newCart = [...prevCart]
          const existingItem = newCart[existingItemIndex]
          const newQuantity = existingItem.quantity + quantity

          // Check stock for updated quantity
          if (product.stock !== undefined && product.stock < newQuantity) {
            toast({
              title: "Insufficient Stock",
              description: `Only ${product.stock} items available`,
              variant: "destructive",
            })
            return prevCart
          }

          newCart[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            subtotal: product.price * newQuantity,
          }
          return newCart
        } else {
          // Add new item
          const newItem: CartItem = {
            product,
            quantity,
            subtotal: product.price * quantity,
          }
          return [...prevCart, newItem]
        }
      })

      toast({
        title: "Added to Cart",
        description: `${product.name} (${quantity}) added to cart`,
      })
    },
    [cart],
  )

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 0) return

    if (quantity === 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          // Check stock availability
          if (item.product.stock !== undefined && item.product.stock < quantity) {
            toast({
              title: "Insufficient Stock",
              description: `Only ${item.product.stock} items available`,
              variant: "destructive",
            })
            return item
          }

          return {
            ...item,
            quantity,
            subtotal: item.product.price * quantity,
          }
        }
        return item
      })
    })
  }, [])

  // Remove item from cart
  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => {
      const item = prevCart.find((item) => item.product.id === productId)
      if (item) {
        toast({
          title: "Removed from Cart",
          description: `${item.product.name} removed from cart`,
        })
      }
      return prevCart.filter((item) => item.product.id !== productId)
    })
  }, [])

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([])
    setDiscount(null)
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart",
    })
  }, [])

  // Clear cart & current receipt (used by POS page)
  const resetTransaction = useCallback(() => {
    clearCart()
    setReceipt(null)
    setTaxEnabled(options.initialTaxEnabled ?? true)
  }, [clearCart, options.initialTaxEnabled])

  // Apply discount
  const applyDiscount = useCallback(
    (newDiscount: Discount) => {
      if (!validateDiscountApplication(totals.subtotal, newDiscount)) {
        toast({
          title: "Invalid Discount",
          description: "This discount cannot be applied to the current cart",
          variant: "destructive",
        })
        return
      }

      setDiscount(newDiscount)
      toast({
        title: "Discount Applied",
        description: `${newDiscount.description} applied to cart`,
      })
    },
    [totals.subtotal],
  )

  // Remove discount
  const removeDiscount = useCallback(() => {
    if (discount) {
      setDiscount(null)
      toast({
        title: "Discount Removed",
        description: "Discount removed from cart",
      })
    }
  }, [discount])

  // Toggle tax
  const toggleTax = useCallback(() => {
    setTaxEnabled((prev) => !prev)
    toast({
      title: taxEnabled ? "Tax Disabled" : "Tax Enabled",
      description: `Tax ${taxEnabled ? "removed from" : "added to"} transaction`,
    })
  }, [taxEnabled])

  // Process transaction
  const processTransaction = useCallback(
    async (paymentMethod: PaymentMethod, isReturn = false, amountTendered?: number): Promise<Transaction | null> => {
      if (cart.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Add items to cart before processing transaction",
          variant: "destructive",
        })
        return null
      }

      if (paymentMethod === "cash" && amountTendered !== undefined) {
        if (amountTendered < totals.total) {
          toast({
            title: "Insufficient Payment",
            description: "Amount tendered is less than total",
            variant: "destructive",
          })
          return null
        }
      }

      try {
        const transaction: Transaction = {
          id: generateId("txn_"),
          items: [...cart],
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          tax: totals.tax,
          total: totals.total,
          timestamp: new Date(),
          paymentMethod,
          isReturn,
          taxApplied: taxEnabled,
          amountTendered,
          changeDue: amountTendered ? Math.max(0, amountTendered - totals.total) : undefined,
          currency: "CAD",
          status: "completed",
        }

        // Persist latest receipt
        setReceipt(transaction)

        // Clear cart after successful transaction
        clearCart()
        setTaxEnabled(options.initialTaxEnabled ?? true)

        // Call completion callback
        options.onTransactionComplete?.(transaction)

        toast({
          title: "Transaction Complete",
          description: `Transaction ${transaction.id} processed successfully`,
        })

        return transaction
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Transaction failed"
        options.onError?.(errorMessage)

        toast({
          title: "Transaction Failed",
          description: errorMessage,
          variant: "destructive",
        })

        return null
      }
    },
    [cart, totals, discount, taxEnabled, clearCart, options],
  )

  // Complete transaction (alias for processTransaction for backward compatibility)
  const completeTransaction = useCallback(
    async (
      paymentMethod: PaymentMethod,
      isReturn = false,
      addTransactionCallback?: (t: Transaction) => void,
    ): Promise<Transaction | null> => {
      const transaction = await processTransaction(paymentMethod, isReturn)
      if (transaction && addTransactionCallback) {
        addTransactionCallback(transaction)
      }
      return transaction
    },
    [processTransaction],
  )

  // Helper methods for backward compatibility
  const getSubtotal = useCallback(() => totals.subtotal, [totals.subtotal])
  const getDiscountAmount = useCallback(() => totals.discountAmount, [totals.discountAmount])
  const getTax = useCallback(() => totals.tax, [totals.tax])
  const getTotal = useCallback(() => totals.total, [totals.total])

  return {
    // State
    cart,
    discount,
    taxEnabled,
    totals,
    receipt,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyDiscount,
    removeDiscount,
    toggleTax,
    processTransaction,
    completeTransaction,
    resetTransaction,

    // Helper methods (for backward compatibility)
    getSubtotal,
    getDiscountAmount,
    getTax,
    getTotal,

    // Computed values
    isEmpty: cart.length === 0,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    uniqueItemCount: cart.length,
  }
}

export default useTransaction
