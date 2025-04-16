"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductCatalog from "@/components/product-catalog"
import ShoppingCart from "@/components/shopping-cart"
import Receipt from "@/components/receipt"
import Reports from "@/components/reports"
import InventoryManagement from "@/components/inventory-management"
import ManualEntryModal from "@/components/manual-entry-modal"
import type { Product, CartItem, Transaction } from "@/types/pos-types"
import { mockProducts } from "@/data/mock-products"
import { saveTransaction, getTransactions } from "@/services/transaction-service"
import { saveProducts, getProducts } from "@/services/product-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function POSSystem() {
  const [activeTab, setActiveTab] = useState("pos")
  const [cart, setCart] = useState<CartItem[]>([])
  const [receipt, setReceipt] = useState<{
    items: CartItem[]
    subtotal: number
    tax: number
    total: number
    transactionId: string
    timestamp: Date
    paymentMethod: string
    isReturn: boolean
  } | null>(null)
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [manualEntryProduct, setManualEntryProduct] = useState<Product | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load transactions and products from Supabase on initial render
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Load transactions from Supabase
        const fetchedTransactions = await getTransactions()
        setTransactions(fetchedTransactions)

        // Load products from Supabase
        const fetchedProducts = await getProducts()

        // If no products in database yet, use mock products and save them
        if (fetchedProducts.length === 0) {
          setProducts(mockProducts)
          await saveProducts(mockProducts)
        } else {
          setProducts(fetchedProducts)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })

        // Fallback to mock products if loading fails
        setProducts(mockProducts)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Save products to Supabase whenever they change
  useEffect(() => {
    if (products.length > 0 && !isLoading) {
      saveProducts(products).catch((error) => {
        console.error("Failed to save products:", error)
      })
    }
  }, [products, isLoading])

  const addToCart = (product: Product) => {
    // Check if the product is from the custom-price category
    if (product.category === "custom-price") {
      setManualEntryProduct(product)
      setIsManualEntryOpen(true)
      return
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)

      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else {
        return [...prevCart, { product, quantity: 1 }]
      }
    })
  }

  const addManualItem = (name: string, price: number, quantity = 1) => {
    // If we have a manual entry product, use its details but with the custom price
    if (manualEntryProduct) {
      const customProduct: Product = {
        ...manualEntryProduct,
        price,
        name: name || manualEntryProduct.name,
      }

      setCart((prevCart) => [...prevCart, { product: customProduct, quantity }])
      setManualEntryProduct(null)
    } else {
      // Otherwise create a completely new manual product
      const manualProduct: Product = {
        id: `manual-${Date.now()}`,
        name,
        price,
        category: "manual",
        imageUrl: "/placeholder.svg?height=100&width=100",
        isManualEntry: true,
      }

      setCart((prevCart) => [...prevCart, { product: manualProduct, quantity }])
    }

    setIsManualEntryOpen(false)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const completeTransaction = async (paymentMethod: string, isReturn = false) => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const tax = subtotal * 0.08 // 8% tax rate
    const total = subtotal + tax

    const transactionId = `TX-${Date.now().toString().slice(-6)}`
    const timestamp = new Date()

    const newReceipt = {
      items: [...cart],
      subtotal,
      tax,
      total: isReturn ? -total : total,
      transactionId,
      timestamp,
      paymentMethod,
      isReturn,
    }

    // Create transaction object
    const newTransaction: Transaction = {
      id: transactionId,
      items: [...cart],
      subtotal,
      tax,
      total: isReturn ? -total : total,
      timestamp,
      paymentMethod,
      isReturn,
    }

    try {
      // Save transaction to Supabase
      const success = await saveTransaction(newTransaction)

      if (success) {
        // Add to local transactions state
        setTransactions((prev) => [newTransaction, ...prev])
        setReceipt(newReceipt)
        setActiveTab("receipt")
        clearCart()

        toast({
          title: "Transaction Complete",
          description: `Transaction ${transactionId} has been saved.`,
        })
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
    }
  }

  const startNewTransaction = () => {
    setReceipt(null)
    setActiveTab("pos")
  }

  const handleProductsChange = (updatedProducts: Product[]) => {
    setProducts(updatedProducts)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">QuickServe POS</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100 p-1 rounded-xl shadow-sm border border-slate-200">
            <TabsTrigger
              value="pos"
              disabled={activeTab === "receipt"}
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Point of Sale
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              disabled={activeTab === "receipt"}
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              disabled={activeTab === "receipt"}
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="receipt"
              disabled={!receipt}
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Receipt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-4">
            {/* Side-by-side layout with 30% cart and 70% products */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Shopping Cart - 30% width */}
              <div className="md:w-[30%]">
                <ShoppingCart
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  onCheckout={completeTransaction}
                  onOpenManualEntry={() => {
                    setManualEntryProduct(null)
                    setIsManualEntryOpen(true)
                  }}
                />
              </div>

              {/* Product Catalog - 70% width */}
              <div className="md:w-[70%]">
                <ProductCatalog
                  products={products}
                  onAddToCart={addToCart}
                  onOpenManualEntry={() => {
                    setManualEntryProduct(null)
                    setIsManualEntryOpen(true)
                  }}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <Reports transactions={transactions} />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement products={products} onProductsChange={handleProductsChange} />
          </TabsContent>

          <TabsContent value="receipt">
            {receipt && <Receipt receipt={receipt} onStartNewTransaction={startNewTransaction} />}
          </TabsContent>
        </Tabs>
      </main>

      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => {
          setIsManualEntryOpen(false)
          setManualEntryProduct(null)
        }}
        onAdd={addManualItem}
        initialName={manualEntryProduct?.name || "Custom Item"}
        initialPrice={manualEntryProduct?.price?.toString() || ""}
      />

      <Toaster />
    </div>
  )
}
