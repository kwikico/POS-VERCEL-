"use client"

import { useState, useCallback } from "react"
import type { CartItem, Product, Discount } from "@/types/pos-types"
import { calculateOrderTotals } from "@/lib/utils"

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [taxEnabled, setTaxEnabled] = useState(true)

  const addToCart = useCallback((product: Product, quantity = 1) => {
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
      setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
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

  // Calculate totals
  const totals = calculateOrderTotals({
    items: cart,
    discount,
    taxEnabled,
  })

  return {
    cart,
    discount,
    taxEnabled,
    totals,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleTax,
    applyDiscount,
    removeDiscount,
  }
}
