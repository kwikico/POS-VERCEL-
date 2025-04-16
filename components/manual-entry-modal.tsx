"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, price: number, quantity: number) => void
  initialName?: string
  initialPrice?: string
}

export default function ManualEntryModal({
  isOpen,
  onClose,
  onAdd,
  initialName = "Custom Item",
  initialPrice = "",
}: ManualEntryModalProps) {
  const [name, setName] = useState(initialName)
  const [price, setPrice] = useState(initialPrice)
  const [quantity, setQuantity] = useState("1")

  // Update state when props change
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setPrice(initialPrice)
      setQuantity("1")
    }
  }, [isOpen, initialName, initialPrice])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedPrice = Number.parseFloat(price)
    const parsedQuantity = Number.parseInt(quantity, 10)

    if (name && !isNaN(parsedPrice) && !isNaN(parsedQuantity) && parsedPrice > 0 && parsedQuantity > 0) {
      onAdd(name, parsedPrice, parsedQuantity)
      resetForm()
    }
  }

  const resetForm = () => {
    setName(initialName)
    setPrice(initialPrice)
    setQuantity("1")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manual Price Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
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
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
                required
                autoFocus={!!initialName && !initialPrice}
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
          </div>
          <DialogFooter>
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
