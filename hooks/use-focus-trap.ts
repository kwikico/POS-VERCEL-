"use client"

import { useEffect, useRef } from "react"

interface UseFocusTrapOptions {
  enabled?: boolean
  restoreFocus?: boolean
}

export function useFocusTrap(options: UseFocusTrapOptions = {}) {
  const { enabled = true, restoreFocus = true } = options
  const containerRef = useRef<HTMLElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    previousActiveElement.current = document.activeElement

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "a[href]",
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(", ")

      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Focus first element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    container.addEventListener("keydown", handleKeyDown)

    return () => {
      container.removeEventListener("keydown", handleKeyDown)

      // Restore focus
      if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [enabled, restoreFocus])

  return containerRef
}

export default useFocusTrap
