"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, price: number, quantity: number, barcode?: string) => void
  initialName?: string
  initialPrice?: string
  initialBarcode?: string
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

  // Refs for input elements
  const nameInputRef = useRef<HTMLInputElement>(null)
  const priceInputRef = useRef<HTMLInputElement>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // Update state when props change
  useEffect(() => {
    if (isOpen) {
      console.log("ManualEntryModal opened with barcode:", initialBarcode) // Debug log
      setName(initialName)
      setPrice(initialPrice)
      setQuantity("1")
      setBarcode(initialBarcode)

      // Focus logic - determine which field to focus
      setTimeout(() => {
        if (initialBarcode) {
          // If we have a barcode, focus on the name field
          nameInputRef.current?.focus()
        } else if (!initialPrice) {
          // If no price is set, focus on the price field
          priceInputRef.current?.focus()
        }
      }, 100)
    }
  }, [isOpen, initialName, initialPrice, initialBarcode])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      console.log("Form submitted with barcode:", barcode)

      const parsedPrice = Number.parseFloat(price)
      const parsedQuantity = Number.parseInt(quantity, 10)

      if (name && !isNaN(parsedPrice) && !isNaN(parsedQuantity) && parsedPrice > 0 && parsedQuantity > 0) {
        onAdd(name, parsedPrice, parsedQuantity, barcode || undefined)
        resetForm()
      }
    },
    [name, price, quantity, barcode, onAdd],
  )

  const resetForm = useCallback(() => {
    setName(initialName)
    setPrice(initialPrice)
    setQuantity("1")
    setBarcode(initialBarcode)
  }, [initialName, initialPrice, initialBarcode])

  const handleClose = useCallback(() => {
    console.log("Manual entry modal closing")
    resetForm()
    onClose()
  }, [resetForm, onClose])

  // Add keyboard shortcut for submitting the form with Ctrl+Enter
  useKeyboardShortcut(
    {
      Enter: (e) => {
        if (e.ctrlKey) {
          console.log("Ctrl+Enter pressed in manual entry")
          const form = document.getElementById("manual-entry-form") as HTMLFormElement
          if (form) form.requestSubmit()
        }
      },
    },
    [handleSubmit],
    {
      enabled: isOpen,
      ignoreInputFields: false,
    },
  )

  // If not open, don't render anything
  if (!isOpen) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manual Price Entry</DialogTitle>
        </DialogHeader>
        <form id="manual-entry-form" onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 border-slate-300 focus:border-slate-400 focus:ring-slate-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price ($)
              </Label>
              <Input
                id="price"
                ref={priceInputRef}
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="barcode" className="text-right">
                Barcode
              </Label>
              <Input
                id="barcode"
                ref={barcodeInputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className={`col-span-3 ${initialBarcode ? "bg-slate-50" : ""}`}
                placeholder="Optional"
                readOnly={!!initialBarcode} // Make it read-only if we have a scanned barcode
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
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Add to Cart
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
