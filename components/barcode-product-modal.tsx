"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Product } from "@/types/pos-types"

interface BarcodeProductModalProps {
  isOpen: boolean
  barcode: string
  onClose: () => void
  onSave: (product: Product) => void
  categories: string[]
}

export default function BarcodeProductModal({
  isOpen,
  barcode,
  onClose,
  onSave,
  categories,
}: BarcodeProductModalProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [quickAdd, setQuickAdd] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, name, price, category, newCategory, quickAdd])

  const handleSave = () => {
    if (!name.trim() || !price.trim()) return

    const priceValue = Number.parseFloat(price)
    if (isNaN(priceValue) || priceValue < 0) return

    setIsProcessing(true)

    // Create new product
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      price: priceValue,
      category: newCategory.trim() || category || "general",
      imageUrl: "/placeholder.svg?height=100&width=100",
      barcode: barcode,
      stock: 10, // Default stock
      quickAdd: quickAdd,
    }

    onSave(newProduct)
    resetForm()
    setIsProcessing(false)
  }

  const resetForm = () => {
    setName("")
    setPrice("")
    setCategory("")
    setNewCategory("")
    setQuickAdd(true)
  }

  // Handle Y/N keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key.toLowerCase() === "y" && document.activeElement === document.body) {
        handleSave()
      } else if (e.key.toLowerCase() === "n" && document.activeElement === document.body) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isOpen, name, price, category, newCategory, quickAdd])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="barcode" className="text-right">
              Barcode
            </Label>
            <Input id="barcode" value={barcode} readOnly className="col-span-3 bg-slate-50" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name *
            </Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price ($) *
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => !["custom-price", "quickadd", "all"].includes(cat))
                  .map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newCategory" className="text-right">
              New Category
            </Label>
            <Input
              id="newCategory"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Or create new category"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quickAdd" className="text-right">
              Quick Add
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch id="quickAdd" checked={quickAdd} onCheckedChange={setQuickAdd} />
              <Label htmlFor="quickAdd">Show in Quick Add section</Label>
            </div>
          </div>
        </div>
        <div className="text-sm text-slate-500 mt-2 text-center">
          <p>Press [Y] to save or [N] to cancel</p>
          <p>Or press [Ctrl+Enter] to save</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
