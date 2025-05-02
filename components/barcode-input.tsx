"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Barcode, X, Keyboard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"

interface BarcodeInputProps {
  onBarcodeSubmit: (barcode: string) => void
  isActive: boolean
}

export default function BarcodeInput({ onBarcodeSubmit, isActive }: BarcodeInputProps) {
  const [barcode, setBarcode] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when the component becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  // Handle barcode submission
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (barcode.trim() && isActive) {
        onBarcodeSubmit(barcode.trim())
        setBarcode("") // Clear the input after submission
      }
    },
    [barcode, onBarcodeSubmit, isActive],
  )

  // Handle keyboard shortcut to focus the barcode input
  useKeyboardShortcut(
    {
      b: () => {
        if (isActive && inputRef.current) {
          inputRef.current.focus()
        }
      },
    },
    [inputRef, isActive],
    { enabled: isActive },
  )

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Most barcode scanners automatically add Enter at the end
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Barcode className={`absolute left-2.5 top-2.5 h-4 w-4 ${isFocused ? "text-emerald-500" : "text-slate-500"}`} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={
            isActive
              ? "Scan or enter barcode... (Press 'B' to focus)"
              : "Barcode scanning disabled while dialog is open"
          }
          className={`pl-8 pr-10 border-slate-300 ${isActive ? "focus:border-emerald-400 focus:ring-emerald-400" : "bg-slate-50 text-slate-400"}`}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete="off"
          aria-label="Barcode input"
          disabled={!isActive}
        />
        {barcode && isActive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
            onClick={() => setBarcode("")}
            aria-label="Clear barcode"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>
      {isActive && (
        <div className="absolute right-3 bottom-1 text-xs text-slate-400 flex items-center">
          <Keyboard className="h-3 w-3 mr-1" />
          <span>B</span>
        </div>
      )}
    </div>
  )
}
