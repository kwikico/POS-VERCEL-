"use client"

import { useRef, useEffect } from "react"

// List of selectors for focusable elements
const FOCUSABLE_ELEMENTS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "details",
  "summary",
].join(", ")

export function useFocusTrap(isActive = false) {
  const containerRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<Element | null>(null)

  // Save the previously focused element and focus the first element in the modal
  useEffect(() => {
    if (isActive && containerRef.current) {
      // Save the currently focused element to restore later
      previousFocusRef.current = document.activeElement

      // Find all focusable elements in the container
      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)

      // Focus the first element if it exists
      if (focusableElements.length > 0) {
        setTimeout(() => {
          focusableElements[0].focus()
        }, 50)
      }
    }

    // Cleanup: restore focus when the modal is closed
    return () => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive])

  // Handle keyboard navigation (trap focus)
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !containerRef.current) return

      // Find all focusable elements in the container
      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS),
      ).filter((el) => el.tabIndex !== -1)

      if (focusableElements.length === 0) return

      // Get the first and last focusable elements
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // If shift+tab and the active element is the first element, move to the last element
      if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus()
        event.preventDefault()
      }
      // If tab and the active element is the last element, move to the first element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus()
        event.preventDefault()
      }
    }

    // Add event listener for keyboard navigation
    document.addEventListener("keydown", handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isActive])

  return containerRef
}
