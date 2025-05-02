"use client"

import { useState } from "react"
import { AlertTriangle, Info, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useFocusTrap } from "@/hooks/use-focus-trap"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "info"
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  // Use our focus trap hook
  const focusTrapRef = useFocusTrap(isOpen)

  // Generate a unique ID for the dialog description
  const dialogDescriptionId = `confirmation-dialog-desc-${title.toLowerCase().replace(/\s+/g, "-")}`

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
      onClose()
    }
  }

  const isDanger = variant === "danger"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        ref={focusTrapRef}
        aria-describedby={dialogDescriptionId}
        onEscapeKeyDown={(e) => {
          // Prevent automatic closing with Escape key
          e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          // Prevent automatic closing when clicking outside
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className={`flex items-center ${isDanger ? "text-red-600" : "text-blue-600"}`}>
            {isDanger ? <AlertTriangle className="h-5 w-5 mr-2" /> : <Info className="h-5 w-5 mr-2" />}
            {title}
          </DialogTitle>
          <DialogDescription id={dialogDescriptionId}>{description}</DialogDescription>
        </DialogHeader>

        {/* Hidden description for screen readers */}
        <p className="sr-only" id={dialogDescriptionId}>
          {description} Press Tab to navigate between buttons, and Enter to activate the selected button.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming || isLoading}
            aria-label={`${cancelText} and close dialog`}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isConfirming || isLoading}
            className={isDanger ? "" : "bg-blue-600 hover:bg-blue-700"}
            aria-label={isConfirming || isLoading ? "Processing, please wait" : confirmText}
          >
            {isConfirming || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span aria-hidden="true">{isDanger ? "Deleting..." : "Processing..."}</span>
                <span className="sr-only">Please wait, operation in progress</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
