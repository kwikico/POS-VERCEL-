"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, Plus } from "lucide-react"
import type { Product } from "@/types/pos-types"

interface QuickAccessButtonsProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export default function QuickAccessButtons({ products, onAddToCart }: QuickAccessButtonsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentButtonIndex, setCurrentButtonIndex] = useState<number | null>(null)
  const [buttonLabel, setButtonLabel] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")

  // Default button configuration - can be stored in localStorage in a real implementation
  const [buttons, setButtons] = useState([
    { label: "Coffee", productId: "p12" },
    { label: "Snacks", productId: "p3" },
    { label: "Drinks", productId: "p1" },
    { label: "Bread", productId: "p9" },
    { label: "Custom", productId: "cp1" },
    { label: "Candy", productId: "p5" },
    { label: "Dairy", productId: "p7" },
    { label: "Household", productId: "p14" },
    { label: "Add New", productId: "" },
  ])

  const handleButtonClick = (index: number) => {
    const button = buttons[index]

    // If it's the "Add New" button or an empty button, open edit dialog
    if (button.label === "Add New" || !button.productId) {
      setCurrentButtonIndex(index)
      setButtonLabel(button.label === "Add New" ? "" : button.label)
      setSelectedProductId("")
      setIsEditDialogOpen(true)
      return
    }

    // Find the product and add to cart
    const product = products.find((p) => p.id === button.productId)
    if (product) {
      onAddToCart(product)
    }
  }

  const handleEditButton = (index: number) => {
    const button = buttons[index]
    setCurrentButtonIndex(index)
    setButtonLabel(button.label)
    setSelectedProductId(button.productId)
    setIsEditDialogOpen(true)
  }

  const handleSaveButton = () => {
    if (currentButtonIndex === null) return

    setButtons((prev) => {
      const newButtons = [...prev]
      newButtons[currentButtonIndex] = {
        label: buttonLabel || "Button",
        productId: selectedProductId,
      }
      return newButtons
    })

    setIsEditDialogOpen(false)
  }

  // Generate button colors based on index for visual variety
  const getButtonColor = (index: number) => {
    const colors = [
      "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300",
      "bg-green-100 hover:bg-green-200 text-green-800 border-green-300",
      "bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300",
      "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300",
      "bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-300",
      "bg-cyan-100 hover:bg-cyan-200 text-cyan-800 border-cyan-300",
      "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300",
      "bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-300",
      "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300",
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Quick Access</h3>
        <span className="text-sm text-slate-500">Customizable shortcuts</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {buttons.map((button, index) => (
          <div key={index} className="relative group">
            <Button
              variant="outline"
              className={`w-full h-16 flex flex-col items-center justify-center text-sm font-medium border-2 ${getButtonColor(index)}`}
              onClick={() => handleButtonClick(index)}
            >
              {button.label}
              {button.productId && (
                <span className="text-xs opacity-70 mt-1">
                  {products.find((p) => p.id === button.productId)?.price
                    ? `$${products.find((p) => p.id === button.productId)?.price.toFixed(2)}`
                    : "Custom"}
                </span>
              )}
              {button.label === "Add New" && <Plus className="h-4 w-4 mt-1" />}
            </Button>

            {/* Edit button overlay */}
            <button
              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                handleEditButton(index)
              }}
            >
              <Edit2 className="h-3 w-3 text-slate-600" />
            </button>
          </div>
        ))}
      </div>

      {/* Edit Button Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Customize Quick Access Button</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="button-label" className="text-right">
                Button Label
              </Label>
              <Input
                id="button-label"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                className="col-span-3"
                placeholder="Enter button label"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product-select" className="text-right">
                Product
              </Label>
              <div className="col-span-3">
                <select
                  id="product-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveButton}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
