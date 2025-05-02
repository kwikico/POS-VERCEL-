"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { AlertCircle, Clock, Barcode, Tag, DollarSign, Package2, AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import { checkBarcodeExists } from "@/services/product-service"

interface ProductNotFoundModalProps {
  isOpen: boolean
  barcode: string
  onClose: () => void
  onAddNew: (productData: {
    name: string
    price: number
    category: string
    barcode: string
    quantity: number
    quickAdd: boolean
  }) => void
}

interface FormErrors {
  name?: string
  price?: string
  category?: string
  quantity?: string
}

export default function ProductNotFoundModal({ isOpen, barcode, onClose, onAddNew }: ProductNotFoundModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(5)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "general",
    quantity: "1",
    quickAdd: false,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingBarcode, setIsCheckingBarcode] = useState(true)
  const [barcodeExists, setBarcodeExists] = useState(false)

  // Use our focus trap hook
  const focusTrapRef = useFocusTrap(isOpen)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset timer and form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeRemaining(5)
      setFormData({
        name: "",
        price: "",
        category: "general",
        quantity: "1",
        quickAdd: false,
      })
      setFormErrors({})
      setIsSubmitting(false)
      setIsCheckingBarcode(true)
      setBarcodeExists(false)
      console.log("ProductNotFoundModal opened with barcode:", barcode)

      // Check if barcode already exists in the database
      const checkBarcode = async () => {
        try {
          const { data: exists, error } = await checkBarcodeExists(barcode)
          if (error) {
            console.error("Error checking barcode:", error)
          } else {
            setBarcodeExists(exists || false)
          }
          setIsCheckingBarcode(false)
        } catch (error) {
          console.error("Error checking barcode:", error)
          setIsCheckingBarcode(false)
        }
      }

      checkBarcode()
    }
  }, [isOpen, barcode])

  // Auto-focus the name input after countdown
  useEffect(() => {
    if (isOpen && timeRemaining === 0 && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isOpen, timeRemaining])

  // Countdown timer and auto-close
  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        if (newTime <= 0) {
          clearInterval(timer)
          // Don't auto-close, just stop the timer
        }
        return newTime > 0 ? newTime : 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleCategoryChange = (value: string) => {
    // Clear category error
    if (formErrors.category) {
      setFormErrors((prev) => ({ ...prev, category: undefined }))
    }

    setFormData((prev) => ({
      ...prev,
      category: value,
    }))
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      errors.name = "Product name is required"
    }

    // Validate price
    const price = Number.parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      errors.price = "Price must be a positive number"
    }

    // Validate category
    if (!formData.category || formData.category === "default-category") {
      errors.category = "Please select a category"
    }

    // Validate quantity
    const quantity = Number.parseInt(formData.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      errors.quantity = "Quantity must be a positive number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Only allow submission if countdown is complete
    if (timeRemaining === 0) {
      // Validate form
      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)

      try {
        const productData = {
          name: formData.name,
          price: Number.parseFloat(formData.price) || 0,
          category: formData.category,
          barcode: barcode,
          quantity: Number.parseInt(formData.quantity) || 1,
          quickAdd: formData.quickAdd,
        }

        onAddNew(productData)
      } catch (error) {
        console.error("Error adding product:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // If not open, don't render anything
  if (!isOpen) return null

  const modalDescription = `No product found with barcode ${barcode}. You can add this product to your inventory by filling out the form.`

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        // Prevent automatic closing
        return false
      }}
    >
      <DialogContent
        className="sm:max-w-[500px]"
        ref={focusTrapRef}
        aria-describedby="product-not-found-desc"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key
          e.preventDefault()
        }}
        onInteractOutside={(e) => {
          // Prevent any interaction outside the dialog
          e.preventDefault()
        }}
      >
        {/* Screen reader only description */}
        <p id="product-not-found-desc" className="sr-only">
          {modalDescription}
        </p>

        <DialogHeader>
          <DialogTitle className="flex items-center text-amber-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Product Not Found
          </DialogTitle>
          <DialogDescription>
            No product found with barcode: <span className="font-mono font-medium">{barcode}</span>
          </DialogDescription>
        </DialogHeader>

        {isCheckingBarcode || timeRemaining > 0 ? (
          <div className="py-4 space-y-4">
            <p className="text-center font-medium">Please wait while we check our database...</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {isCheckingBarcode ? "Verifying barcode..." : "Checking inventory..."}
              </span>
              <span className="text-xs text-slate-400">{timeRemaining}s remaining</span>
            </div>
            <Progress
              value={(5 - timeRemaining) * 20}
              className="h-1"
              aria-label={`Checking database, ${timeRemaining} seconds remaining`}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            <p className="font-medium">Add this product to your inventory:</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Product Name*
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  ref={nameInputRef}
                  className={formErrors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                  aria-required="true"
                />
                {formErrors.name && (
                  <p id="name-error" className="text-xs text-red-500 flex items-center mt-1" aria-live="polite">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Price*
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={formErrors.price ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  aria-invalid={!!formErrors.price}
                  aria-describedby={formErrors.price ? "price-error" : undefined}
                  aria-required="true"
                />
                {formErrors.price && (
                  <p id="price-error" className="text-xs text-red-500 flex items-center mt-1" aria-live="polite">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {formErrors.price}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center">
                  <Package2 className="h-4 w-4 mr-1" />
                  Category*
                </Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger
                    id="category"
                    className={formErrors.category ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                    aria-invalid={!!formErrors.category}
                    aria-describedby={formErrors.category ? "category-error" : undefined}
                    aria-required="true"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="household">Household</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p id="category-error" className="text-xs text-red-500 flex items-center mt-1" aria-live="polite">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {formErrors.category}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="flex items-center">
                  <Package2 className="h-4 w-4 mr-1" />
                  Quantity*
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="1"
                  className={formErrors.quantity ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  aria-invalid={!!formErrors.quantity}
                  aria-describedby={formErrors.quantity ? "quantity-error" : undefined}
                  aria-required="true"
                />
                {formErrors.quantity && (
                  <p id="quantity-error" className="text-xs text-red-500 flex items-center mt-1" aria-live="polite">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {formErrors.quantity}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode" className="flex items-center">
                <Barcode className="h-4 w-4 mr-1" />
                Barcode
              </Label>
              <Input id="barcode" value={barcode} readOnly className="bg-slate-50" aria-label={`Barcode: ${barcode}`} />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="quickAdd"
                name="quickAdd"
                checked={formData.quickAdd}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, quickAdd: checked }))}
                aria-label="Add to Quick Access"
              />
              <Label htmlFor="quickAdd">Add to Quick Access</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Cancel adding product"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} aria-label="Add product to inventory">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span aria-hidden="true">Adding...</span>
                    <span className="sr-only">Adding product, please wait</span>
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
