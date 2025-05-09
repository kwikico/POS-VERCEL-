"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import NavigationBar from "@/components/navigation-bar"
import ContentContainer from "@/components/content-container"
import ProductCatalog from "@/components/product-catalog"
import ShoppingCart from "@/components/shopping-cart"
import Receipt from "@/components/receipt"
import Reports from "@/components/reports"
import InventoryManagement from "@/components/inventory-management"
import ManualEntryModal from "@/components/manual-entry-modal"
import BarcodeInput from "@/components/barcode-input"
import ProductNotFoundModal from "@/components/product-not-found-modal"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { useTransaction } from "@/hooks/use-transaction"
import { useProducts } from "@/hooks/use-products"
import { useTransactionsData } from "@/hooks/use-transactions-data"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import { TOAST_DURATION } from "@/lib/constants"
import { ErrorBoundary } from "@/components/error-boundary"
import { getProductByBarcode, checkBarcodeExists } from "@/services/product-service"
import type { Product } from "@/types/pos-types"

// Create a recent scans cache to optimize repeated scans
const RECENT_SCANS_LIMIT = 50
const recentScans = new Map<string, Product>()

export default function POSSystem() {
  const [activeTab, setActiveTab] = useState("pos")
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [manualEntryProduct, setManualEntryProduct] = useState<Product | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const [isProductNotFoundOpen, setIsProductNotFoundOpen] = useState(false)

  // Ref to track if we're in the process of handling a not-found barcode
  const processingBarcodeRef = useRef(false)

  // Store the barcode in a ref to ensure it's always current in callbacks
  const currentBarcodeRef = useRef("")

  // Use our custom hooks
  const { products, isLoading: productsLoading, updateProducts } = useProducts()
  const { transactions, addTransaction } = useTransactionsData()
  const {
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
  } = useTransaction()

  // Update the ref when scannedBarcode changes
  useEffect(() => {
    currentBarcodeRef.current = scannedBarcode
  }, [scannedBarcode])

  // Handle keyboard shortcuts for global app actions
  useKeyboardShortcut(
    {
      f1: () => setActiveTab("pos"),
      f2: () => setActiveTab("reports"),
      f3: () => setActiveTab("inventory"),
      f4: () => receipt && setActiveTab("receipt"),
      n: () => {
        if (activeTab === "pos" && !isProductNotFoundOpen && !isManualEntryOpen) {
          openManualEntry()
        }
      },
      c: () => {
        if (activeTab === "pos" && cart.length > 0) {
          clearCart()
          toast({
            title: "Cart cleared",
            description: "All items have been removed from the cart",
            duration: TOAST_DURATION,
          })
        }
      },
    },
    [activeTab, cart.length, receipt, clearCart, isProductNotFoundOpen, isManualEntryOpen],
  )

  const handleAddToCart = useCallback(
    (product: Product) => {
      // Check if the product is from the custom-price category
      if (product.category === "custom-price") {
        setManualEntryProduct(product)
        setIsManualEntryOpen(true)
        return
      }

      // Add to recent scans cache for faster lookup next time
      if (product.barcode) {
        // Use LRU cache approach - if we hit the limit, remove oldest entry
        if (recentScans.size >= RECENT_SCANS_LIMIT) {
          const firstKey = recentScans.keys().next().value
          recentScans.delete(firstKey)
        }
        recentScans.set(product.barcode, product)
      }

      addToCart(product)

      // Show a toast notification
      toast({
        title: "Added to cart",
        description: `${product.name} added to cart`,
        duration: TOAST_DURATION,
      })
    },
    [addToCart],
  )

  const openManualEntry = useCallback(() => {
    setManualEntryProduct(null)
    setIsManualEntryOpen(true)
  }, [])

  const handleAddManualItem = useCallback(
    (name: string, price: number, quantity = 1, barcode?: string) => {
      console.log("Adding manual item with barcode:", barcode)

      // If we have a manual entry product, use its details but with the custom price
      if (manualEntryProduct) {
        const customProduct: Product = {
          ...manualEntryProduct,
          price,
          name: name || manualEntryProduct.name,
          barcode: barcode || manualEntryProduct.barcode,
        }

        addToCart(customProduct, quantity)
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
          barcode, // Make sure barcode is included
        }

        addToCart(manualProduct, quantity)
      }

      // Reset processing state
      processingBarcodeRef.current = false

      // Close modals and clear barcode
      setIsManualEntryOpen(false)
      setIsProductNotFoundOpen(false)
      setScannedBarcode("") // Clear the scanned barcode after adding

      // Show success toast
      toast({
        title: "Added to cart",
        description: `${name} added to cart`,
        duration: TOAST_DURATION,
      })
    },
    [manualEntryProduct, addToCart],
  )

  const handleCompleteTransaction = useCallback(
    async (paymentMethod: string, isReturn = false) => {
      try {
        const transaction = await completeTransaction(paymentMethod, isReturn, addTransaction)
        if (transaction) {
          setActiveTab("receipt")

          // Show success toast
          toast({
            title: "Transaction complete",
            description: `Transaction ${transaction.id} has been processed`,
            duration: TOAST_DURATION,
          })
        }
      } catch (error) {
        console.error("Error completing transaction:", error)

        // Show error toast
        toast({
          title: "Transaction failed",
          description: "There was an error processing the transaction",
          variant: "destructive",
          duration: TOAST_DURATION,
        })
      }
    },
    [completeTransaction, addTransaction],
  )

  const handleStartNewTransaction = useCallback(() => {
    resetTransaction()
    setActiveTab("pos")
  }, [resetTransaction])

  // Check if a product with the given barcode already exists in the inventory
  const findProductByBarcode = useCallback(
    (barcode: string): Product | undefined => {
      // First check the recent scans cache for fastest lookup
      if (recentScans.has(barcode)) {
        return recentScans.get(barcode)
      }

      // Then check the full products array
      return products.find((product) => product.barcode === barcode)
    },
    [products],
  )

  // Optimized barcode scanning process
  const handleBarcodeSubmit = useCallback(
    async (barcode: string) => {
      console.log("Barcode scanned:", barcode)

      // Prevent processing if we're already handling a barcode
      if (processingBarcodeRef.current) {
        console.log("Already processing a barcode, ignoring:", barcode)
        return
      }

      // Set processing flag
      processingBarcodeRef.current = true

      try {
        // First, check the recent scans cache for fastest lookup
        if (recentScans.has(barcode)) {
          const cachedProduct = recentScans.get(barcode)
          console.log("Product found in recent scans cache:", cachedProduct)
          handleAddToCart(cachedProduct!)
          processingBarcodeRef.current = false
          return
        }

        // Then check if the product already exists in our local inventory
        const existingProduct = findProductByBarcode(barcode)

        if (existingProduct) {
          console.log("Product found in local inventory:", existingProduct)

          // If product found in local inventory, add to cart directly
          handleAddToCart(existingProduct)

          // Reset processing flag
          processingBarcodeRef.current = false
          return
        }

        // Before making a full product query, check if barcode exists
        // This is faster than fetching the entire product
        const { data: exists } = await checkBarcodeExists(barcode)

        if (exists) {
          // If barcode exists, fetch the full product
          const { data: product, error } = await getProductByBarcode(barcode)

          if (error) {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
              duration: TOAST_DURATION,
            })
            processingBarcodeRef.current = false
            return
          }

          if (product) {
            console.log("Product found in database:", product)
            // If product found in database, add to cart
            handleAddToCart(product)

            // Show success toast
            toast({
              title: "Product scanned",
              description: `${product.name} added to cart`,
              duration: TOAST_DURATION,
            })

            // Reset processing flag
            processingBarcodeRef.current = false
          }
        } else {
          console.log("Product not found for barcode:", barcode)

          // If product not found, show modal and store the barcode
          setScannedBarcode(barcode)
          console.log("Setting scanned barcode state:", barcode)

          // Ensure the modal is opened
          setIsProductNotFoundOpen(true)
          console.log("Opening product not found modal")
          // Keep processing flag true until modal is handled
        }
      } catch (error) {
        console.error("Error processing barcode:", error)
        toast({
          title: "Error",
          description: "Failed to process barcode",
          variant: "destructive",
          duration: TOAST_DURATION,
        })
        processingBarcodeRef.current = false
      }
    },
    [handleAddToCart, findProductByBarcode],
  )

  // Handle adding a new product from the ProductNotFoundModal - UPDATED to add to cart
  const handleAddNewProduct = useCallback(
    (productData: {
      name: string
      price: number
      category: string
      barcode: string
      quantity: number
      quickAdd: boolean
    }) => {
      console.log("Adding new product:", productData)

      // Create a new product
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name: productData.name,
        price: productData.price,
        category: productData.category,
        imageUrl: "/placeholder.svg?height=100&width=100",
        barcode: productData.barcode,
        stock: productData.quantity,
        quickAdd: productData.quickAdd,
      }

      // Add the product to the inventory
      updateProducts([...products, newProduct])

      // Add to recent scans cache
      if (newProduct.barcode) {
        if (recentScans.size >= RECENT_SCANS_LIMIT) {
          const firstKey = recentScans.keys().next().value
          recentScans.delete(firstKey)
        }
        recentScans.set(newProduct.barcode, newProduct)
      }

      // Add the product to the cart
      addToCart(newProduct)

      // Reset processing state
      processingBarcodeRef.current = false

      // Close the modal
      setIsProductNotFoundOpen(false)
      setScannedBarcode("")

      // Show success toast
      toast({
        title: "Product added",
        description: `${newProduct.name} has been added to inventory and cart`,
        duration: TOAST_DURATION,
      })
    },
    [products, updateProducts, addToCart],
  )

  // Handle "No" on product not found modal
  const handleCloseProductNotFound = useCallback(() => {
    console.log("ProductNotFoundModal closed")
    setIsProductNotFoundOpen(false)
    setScannedBarcode("") // Clear the barcode when closing

    // Reset processing flag
    processingBarcodeRef.current = false
  }, [])

  // Close manual entry modal
  const handleCloseManualEntry = useCallback(() => {
    console.log("Closing manual entry modal")
    setIsManualEntryOpen(false)
    setManualEntryProduct(null)
    setScannedBarcode("") // Clear the barcode when closing

    // Reset processing flag
    processingBarcodeRef.current = false
  }, [])

  // Error handler for error boundaries
  const handleError = useCallback((error: Error, info: React.ErrorInfo) => {
    console.error("Error caught by ErrorBoundary:", error, info)
    toast({
      title: "Error",
      description: "An error occurred. Some functionality may be limited.",
      variant: "destructive",
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary onError={handleError}>
        <NavigationBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNewTransaction={handleStartNewTransaction}
          hasReceipt={!!receipt}
        />

        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <ContentContainer isActive={activeTab === "pos"}>
            {/* Barcode Scanner - only show on POS tab */}
            <div className="mb-4">
              <BarcodeInput
                onBarcodeSubmit={handleBarcodeSubmit}
                isActive={activeTab === "pos" && !isProductNotFoundOpen && !isManualEntryOpen}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {/* Shopping Cart - 40% width */}
              <div className="md:w-[40%]">
                <ErrorBoundary
                  onError={handleError}
                  fallback={
                    <div className="bg-red-50 p-4 rounded-md border border-red-200 h-full">
                      <h3 className="text-red-600 font-medium mb-2">Cart Error</h3>
                      <p className="text-sm text-slate-700">
                        There was a problem loading the shopping cart. Try refreshing the page.
                      </p>
                    </div>
                  }
                >
                  <ShoppingCart
                    cart={cart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeFromCart}
                    onClearCart={clearCart}
                    onCheckout={handleCompleteTransaction}
                    onOpenManualEntry={openManualEntry}
                    taxEnabled={taxEnabled}
                    onTaxToggle={toggleTax}
                    discount={discount}
                    onApplyDiscount={applyDiscount}
                    onRemoveDiscount={removeDiscount}
                  />
                </ErrorBoundary>
              </div>

              {/* Product Catalog - 60% width */}
              <div className="md:w-[60%]">
                <ErrorBoundary
                  onError={handleError}
                  fallback={
                    <div className="bg-red-50 p-4 rounded-md border border-red-200 h-full">
                      <h3 className="text-red-600 font-medium mb-2">Product Catalog Error</h3>
                      <p className="text-sm text-slate-700">
                        There was a problem loading the product catalog. Try refreshing the page.
                      </p>
                    </div>
                  }
                >
                  <ProductCatalog products={products} onAddToCart={handleAddToCart} isLoading={productsLoading} />
                </ErrorBoundary>
              </div>
            </div>
          </ContentContainer>

          <ContentContainer isActive={activeTab === "reports"}>
            <ErrorBoundary onError={handleError}>
              <Reports transactions={transactions} />
            </ErrorBoundary>
          </ContentContainer>

          <ContentContainer isActive={activeTab === "inventory"}>
            <ErrorBoundary onError={handleError}>
              <InventoryManagement products={products} onProductsChange={updateProducts} />
            </ErrorBoundary>
          </ContentContainer>

          <ContentContainer isActive={activeTab === "receipt"}>
            <ErrorBoundary onError={handleError}>
              {receipt && <Receipt receipt={receipt} onStartNewTransaction={handleStartNewTransaction} />}
            </ErrorBoundary>
          </ContentContainer>
        </main>
      </ErrorBoundary>

      {/* Product Not Found Modal */}
      <ProductNotFoundModal
        isOpen={isProductNotFoundOpen}
        barcode={scannedBarcode}
        onClose={handleCloseProductNotFound}
        onAddNew={handleAddNewProduct}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={handleCloseManualEntry}
        onAdd={handleAddManualItem}
        initialName={manualEntryProduct?.name || "Custom Item"}
        initialPrice={manualEntryProduct?.price?.toString() || ""}
        initialBarcode={scannedBarcode}
      />

      <Toaster />
    </div>
  )
}
