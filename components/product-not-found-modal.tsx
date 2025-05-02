"use client"

import { useRef, useEffect } from "react"
import { AlertCircle, Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"

interface ProductNotFoundModalProps {
  isOpen: boolean
  barcode: string
  onClose: () => void
  onAddNew: () => void
}

export default function ProductNotFoundModal({ isOpen, barcode, onClose, onAddNew }: ProductNotFoundModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Log when the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      console.log("ProductNotFoundModal opened with barcode:", barcode)
    }
  }, [isOpen, barcode])

  // Handle keyboard shortcuts
  useKeyboardShortcut(
    {
      y: () => {
        if (isOpen) {
          console.log("Y key pressed for barcode:", barcode)
          onAddNew()
        }
      },
      n: () => {
        if (isOpen) {
          console.log("N key pressed for barcode:", barcode)
          onClose()
        }
      },
    },
    [onAddNew, onClose, barcode, isOpen],
    { enabled: isOpen },
  )

  // Create a direct handler for the Yes button
  const handleYesClick = () => {
    console.log("Yes button clicked for barcode:", barcode)
    onAddNew()
  }

  // Create a direct handler for the No button
  const handleNoClick = () => {
    console.log("No button clicked for barcode:", barcode)
    onClose()
  }

  // If not open, don't render anything to avoid any state issues
  if (!isOpen) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Only allow explicit close actions, not automatic ones
        if (!open) {
          console.log("Dialog attempting to close automatically - preventing")
          // We don't call onClose() here to prevent automatic closing
          return false
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]" ref={dialogRef}>
        <DialogHeader>
          <DialogTitle className="flex items-center text-amber-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Product Not Found
          </DialogTitle>
          <DialogDescription>
            No product found with barcode: <span className="font-mono font-medium">{barcode}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">Would you like to add it as a new product?</div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="text-sm text-slate-500 flex items-center">
            <Keyboard className="h-3 w-3 mr-1" />
            Press <kbd className="mx-1 px-1 py-0.5 bg-slate-100 rounded border">Y</kbd> for Yes,
            <kbd className="mx-1 px-1 py-0.5 bg-slate-100 rounded border">N</kbd> for No
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleNoClick}>
              No
            </Button>
            <Button onClick={handleYesClick}>Yes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
