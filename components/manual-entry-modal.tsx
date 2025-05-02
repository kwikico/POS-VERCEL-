"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import { Loader2, AlertTriangle } from "lucide-react"
import { useFocusTrap } from "@/hooks/use-focus-trap"

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, price: number, quantity: number, barcode?: string) => void
  initialName?: string
  initialPrice?: string
  initialBarcode?: string
}

interface FormErrors {
  name?: string
  price?: string
  quantity?: string
}

export default function ManualEntryModal({
  isOpen,
  onClose,
  onAdd,
  initialName = "Custom Item",
  initialPrice = "",
  initialBarcode = "",
}: ManualEntryModalProps) {
  const [name, setName] = useState(initialName)
  const [price, setPrice] = useState(initialPrice)
  const [quantity, setQuantity] = useState("1")
  const [barcode, setBarcode] = useState(initialBarcode)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refs for input elements
  const nameInputRef = useRef<HTMLInputElement>(null)
  const priceInputRef = useRef<HTMLInputElement>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // Use our focus trap hook
  const focusTrapRef = useFocusTrap(isOpen)

  // Store the current barcode in a ref to ensure it's always current
  const currentBarcodeRef = useRef(initialBarcode)

  // Update state when props change
  useEffect(() => {
    if (isOpen) {
      console.log("ManualEntryModal opened with barcode:", initialBarcode) // Debug log
      setName(initialName)
      setPrice(initialPrice)
      setQuantity("1")
      setBarcode(initialBarcode)
      currentBarcodeRef.current = initialBarcode
      setFormErrors({})
      setIsSubmitting(false)

      // Focus logic - determine which field to focus
      setTimeout(() => {
        if (initialBarcode) {
          // If we have a barcode, focus on the name field
          nameInputRef.current?.focus()
        } else if (!initialPrice) {
          // If no price is set, focus on the price field
          priceInputRef.current?.focus()
        } else {
          // Default focus on name field
          nameInputRef.current?.focus()
        }
      }, 100)
    }
  }, [isOpen, initialName, initialPrice, initialBarcode])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Validate name
    if (!name.trim()) {
      errors.name = "Item name is required"
    }

    // Validate price
    const priceValue = Number.parseFloat(price)
    if (isNaN(priceValue) || priceValue <= 0) {
      errors.price = "Price must be a positive number"
    }

    // Validate quantity
    const quantityValue = Number.parseInt(quantity)
    if (isNaN(quantityValue) || quantityValue <= 0) {
      errors.quantity = "Quantity must be a positive number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validate form
      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)

      try {
        // Use the current barcode from the ref to ensure it's the latest value
        const currentBarcode = currentBarcodeRef.current
        console.log("Form submitted with barcode:", currentBarcode)

        const parsedPrice = Number.parseFloat(price)
        const parsedQuantity = Number.parseInt(quantity, 10)

        if (name && !isNaN(parsedPrice) && !isNaN(parsedQuantity) && parsedPrice > 0 && parsedQuantity > 0) {
          onAdd(name, parsedPrice, parsedQuantity, currentBarcode || undefined)
          resetForm()
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, price, quantity, onAdd],
  )

  const resetForm = useCallback(() => {
    setName(initialName)
    setPrice(initialPrice)
    setQuantity("1")
    setBarcode(initialBarcode)
    setFormErrors({})
  }, [initialName, initialPrice, initialBarcode])

  const handleClose = useCallback(() => {
    console.log("Manual entry modal closing")
    resetForm()
    onClose()
  }, [resetForm, onClose])

  // Update the barcode ref when the barcode state changes
  useEffect(() => {
    currentBarcodeRef.current = barcode
  }, [barcode])

  // Add keyboard shortcut for submitting the form with Ctrl+Enter
  useKeyboardShortcut(
    {
      Enter: (e) => {
        if (e.ctrlKey && isOpen) {
          console.log("Ctrl+Enter pressed in manual entry")
          const form = document.getElementById("manual-entry-form") as HTMLFormElement
          if (form) form.requestSubmit()
        }
      },
    },
    [isOpen],
    {
      enabled: isOpen,
      ignoreInputFields: false,
    },
  )

  // Handle input changes and clear errors
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const { name, value } = e.target

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    setter(value)
  }

  // If not open, don't render anything
  if (!isOpen) return null

  const modalDescription = "Use this form to manually add a product or set a custom price for an existing product."

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent
        className="sm:max-w-[425px]"
        aria-describedby="manual-entry-desc"
        ref={focusTrapRef}
        onEscapeKeyDown={(e) => {
          // Prevent automatic closing with Escape key
          e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          // Prevent automatic closing when clicking outside
          e.preventDefault()
        }}
      >
        {/* Screen reader only description */}
        <p id="manual-entry-desc" className="sr-only">
          {modalDescription}
        </p>
        <DialogHeader>
          <DialogTitle>Manual Price Entry</DialogTitle>
        </DialogHeader>
        <form id="manual-entry-form" onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  name="name"
                  ref={nameInputRef}
                  value={name}
                  onChange={(e) => handleInputChange(e, setName)}
                  className={`border-slate-300 focus:border-slate-400 focus:ring-slate-400 ${
                    formErrors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
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
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price ($)*
              </Label>
              <div className="col-span-3">
                <Input
                  id="price"
                  name="price"
                  ref={priceInputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => handleInputChange(e, setPrice)}
                  className={formErrors.price ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  placeholder="0.00"
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity*
              </Label>
              <div className="col-span-3">
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => handleInputChange(e, setQuantity)}
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="barcode" className="text-right">
                Barcode
              </Label>
              <Input
                id="barcode"
                name="barcode"
                ref={barcodeInputRef}
                value={barcode}
                onChange={(e) => handleInputChange(e, setBarcode)}
                className={`col-span-3 ${initialBarcode ? "bg-slate-50" : ""} ${
                  formErrors.barcode ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="Optional"
                readOnly={!!initialBarcode} // Make it read-only if we have a scanned barcode
                aria-label={barcode ? `Barcode: ${barcode}` : "Enter barcode (optional)"}
              />
            </div>
          </div>
          <DialogFooter>
            <div className="text-xs text-slate-500 mr-auto">
              Press <kbd className="px-1 py-0.5 bg-slate-100 rounded border">Ctrl+Enter</kbd> to submit
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-slate-300 hover:bg-slate-50"
              disabled={isSubmitting}
              aria-label="Cancel manual entry"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
              aria-label="Add item to cart"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span aria-hidden="true">Adding...</span>
                  <span className="sr-only">Adding item to cart, please wait</span>
                </>
              ) : (
                "Add to Cart"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
