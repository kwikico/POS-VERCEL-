"use client"

import { useState, useCallback, useRef } from "react"
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
import type { Product } from "@/types/pos-types"

export default function POSSystem() {
  const [activeTab, setActiveTab] = useState("pos")
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [manualEntryProduct, setManualEntryProduct] = useState<Product | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const [isProductNotFoundOpen, setIsProductNotFoundOpen] = useState(false)

  // Ref to track if we're in the process of handling a not-found barcode
  const processingBarcodeRef = useRef(false)

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

  // Handle barcode scanning
  const handleBarcodeSubmit = useCallback(
    (barcode: string) => {
      console.log("Barcode scanned:", barcode) // Debug log

      // Prevent processing if we're already handling a barcode
      if (processingBarcodeRef.current) {
        console.log("Already processing a barcode, ignoring:", barcode)
        return
      }

      // Search for product with matching barcode
      const product = products.find((p) => p.barcode === barcode)

      if (product) {
        console.log("Product found:", product) // Debug log
        // If product found, add to cart
        handleAddToCart(product)

        // Show success toast
        toast({
          title: "Product scanned",
          description: `${product.name} added to cart`,
          duration: TOAST_DURATION,
        })
      } else {
        console.log("Product not found for barcode:", barcode) // Debug log

        // Set processing flag
        processingBarcodeRef.current = true

        // If product not found, show modal and store the barcode
        setScannedBarcode(barcode)
        console.log("Setting scanned barcode state:", barcode)

        // Ensure the modal is opened
        setIsProductNotFoundOpen(true)
        console.log("Opening product not found modal")
      }
    },
    [products, handleAddToCart],
  )

  // Handle "Yes" on product not found modal
  const handleAddNewProduct = useCallback(() => {
    console.log("Adding new product for barcode:", scannedBarcode) // Debug log

    // First close the product not found modal
    setIsProductNotFoundOpen(false)

    // Then open the manual entry modal with the scanned barcode
    // Use setTimeout to ensure state updates properly
    setTimeout(() => {
      setIsManualEntryOpen(true)
      console.log("Manual entry opened with barcode:", scannedBarcode)
    }, 100)
  }, [scannedBarcode])

  // Handle "No" on product not found modal
  const handleCloseProductNotFound = useCallback(() => {
    console.log("ProductNotFoundModal closed via No button")
    setIsProductNotFoundOpen(false)
    setScannedBarcode("") // Clear the barcode when closing with "No"

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

  return (
    <div className="min-h-screen bg-gray-50">
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
            </div>

            {/* Product Catalog - 60% width */}
            <div className="md:w-[60%]">
              <ProductCatalog products={products} onAddToCart={handleAddToCart} isLoading={productsLoading} />
            </div>
          </div>
        </ContentContainer>

        <ContentContainer isActive={activeTab === "reports"}>
          <Reports transactions={transactions} />
        </ContentContainer>

        <ContentContainer isActive={activeTab === "inventory"}>
          <InventoryManagement products={products} onProductsChange={updateProducts} />
        </ContentContainer>

        <ContentContainer isActive={activeTab === "receipt"}>
          {receipt && <Receipt receipt={receipt} onStartNewTransaction={handleStartNewTransaction} />}
        </ContentContainer>
      </main>

      {/* Product Not Found Modal - Render conditionally to ensure it's properly controlled */}
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
