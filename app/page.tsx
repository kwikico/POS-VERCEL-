"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import ProductCatalog from "@/components/product-catalog"
import ShoppingCart from "@/components/shopping-cart"
import ReceiptComponent from "@/components/receipt"
import Reports from "@/components/reports"
import InventoryManagement from "@/components/inventory-management"
import ManualEntryModal from "@/components/manual-entry-modal"
import type { Product, CartItem, Transaction, Discount } from "@/types/pos-types"
import { mockProducts } from "@/data/mock-products"
import { ProductService, TransactionService } from "@/services/data-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ShoppingCartIcon as CartIcon, ShoppingBag, BarChart3, Package, Receipt, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { calculateOrderTotals, generateTransactionId } from "@/lib/utils"
import { ErrorBoundary } from "@/components/error-boundary"
import { validateDatabaseSchema } from "@/lib/schema-validation"

export default function POSSystem() {
  const [activeTab, setActiveTab] = useState("pos")
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
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [manualEntryProduct, setManualEntryProduct] = useState<Product | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [schemaValidationError, setSchemaValidationError] = useState<string | null>(null)

  // Load transactions and products from Supabase on initial render
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Validate database schema
        const schemaValidation = await validateDatabaseSchema()
        if (!schemaValidation.isValid) {
          console.error("Database schema validation failed:", schemaValidation)
          if (schemaValidation.missingTables.length > 0) {
            setSchemaValidationError(
              `Missing tables: ${schemaValidation.missingTables.join(", ")}. Please run the database migration.`,
            )
          } else if (Object.keys(schemaValidation.missingColumns).length > 0) {
            const missingColumnsText = Object.entries(schemaValidation.missingColumns)
              .map(([table, columns]) => `${table}: ${columns.join(", ")}`)
              .join("; ")
            setSchemaValidationError(`Missing columns: ${missingColumnsText}. Please run the database migration.`)
          }
          // Continue loading anyway to allow the app to work with mock data
        }

        // Load transactions from Supabase
        const fetchedTransactions = await TransactionService.getAll()
        setTransactions(fetchedTransactions)

        // Load products from Supabase
        const fetchedProducts = await ProductService.getAll()

        // If no products in database yet, use mock products and save them
        if (fetchedProducts.length === 0) {
          setProducts(mockProducts)
          await ProductService.save(mockProducts)
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
      ProductService.save(products).catch((error) => {
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

  const handleAddProduct = (newProduct: Product) => {
    // Add the new product to the products state
    setProducts((prevProducts) => [...prevProducts, newProduct])

    // Show success toast
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been added to inventory.`,
    })
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
    setDiscount(null)
  }

  const toggleTax = () => {
    setTaxEnabled(!taxEnabled)
  }

  const handleApplyDiscount = (newDiscount: Discount) => {
    setDiscount(newDiscount)
  }

  const handleRemoveDiscount = () => {
    setDiscount(null)
  }

  const completeTransaction = async (paymentMethod: string, isReturn = false) => {
    const { subtotal, discountAmount, tax, total } = calculateOrderTotals({
      items: cart,
      discount,
      taxEnabled,
    })

    const transactionId = generateTransactionId()
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

    // Create transaction object
    const newTransaction: Transaction = {
      id: transactionId,
      items: [...cart],
      subtotal,
      discount: discount || undefined,
      discountAmount: discountAmount || undefined,
      tax,
      total: isReturn ? -total : total,
      timestamp,
      paymentMethod,
      isReturn,
      taxApplied: taxEnabled,
    }

    try {
      // Save transaction to Supabase
      const success = await TransactionService.save(newTransaction)

      if (success) {
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
    setDiscount(null)
    setTaxEnabled(true)
  }

  const handleProductsChange = (updatedProducts: Product[]) => {
    setProducts(updatedProducts)
  }

  const handleOpenManualEntry = () => {
    setManualEntryProduct(null)
    setIsManualEntryOpen(true)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-pink-500 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-2xl font-bold cursor-pointer flex items-center" onClick={startNewTransaction}>
                <div className="bg-white text-blue-600 rounded-full p-2 mr-3 shadow-lg">
                  <CartIcon className="h-6 w-6" />
                </div>
                KWIKI CONVENIENCE
              </div>

              {/* Main Navigation Buttons */}
              <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 p-1 rounded-xl shadow-inner">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("pos")}
                  disabled={activeTab === "receipt"}
                  className={`nav-btn flex items-center ${
                    activeTab === "pos" ? "nav-btn-active" : "text-white/90 hover:text-white"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  <span>Point of Sale</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("reports")}
                  disabled={activeTab === "receipt"}
                  className={`nav-btn flex items-center ${
                    activeTab === "reports" ? "nav-btn-active" : "text-white/90 hover:text-white"
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  <span>Reports</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("inventory")}
                  disabled={activeTab === "receipt"}
                  className={`nav-btn flex items-center ${
                    activeTab === "inventory" ? "nav-btn-active" : "text-white/90 hover:text-white"
                  }`}
                >
                  <Package className="h-4 w-4 mr-1" />
                  <span>Inventory</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("receipt")}
                  disabled={!receipt}
                  className={`nav-btn flex items-center ${
                    activeTab === "receipt" ? "nav-btn-active" : "text-white/90 hover:text-white"
                  }`}
                >
                  <Receipt className="h-4 w-4 mr-1" />
                  <span>Receipt</span>
                </Button>
              </div>

              {/* Date/Time Display */}
              <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {new Date().toLocaleDateString()}{" "}
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </header>

        {schemaValidationError && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 max-w-7xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  {schemaValidationError}{" "}
                  <a
                    href="/api/migrate"
                    className="font-medium underline hover:text-amber-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Run migration
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="pos" className="space-y-4">
              {/* Side-by-side layout with 40% cart and 60% products */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Shopping Cart - 40% width */}
                <div className="md:w-[40%]">
                  <ShoppingCart
                    cart={cart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeFromCart}
                    onClearCart={clearCart}
                    onCheckout={completeTransaction}
                    onOpenManualEntry={handleOpenManualEntry}
                    taxEnabled={taxEnabled}
                    onTaxToggle={toggleTax}
                    discount={discount}
                    onApplyDiscount={handleApplyDiscount}
                    onRemoveDiscount={handleRemoveDiscount}
                  />
                </div>

                {/* Product Catalog - 60% width */}
                <div className="md:w-[60%]">
                  <ProductCatalog
                    products={products}
                    onAddToCart={addToCart}
                    onOpenManualEntry={handleOpenManualEntry}
                    onAddProduct={handleAddProduct}
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
              {receipt && <ReceiptComponent receipt={receipt} onStartNewTransaction={startNewTransaction} />}
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
    </ErrorBoundary>
  )
}
