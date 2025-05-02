"use client"

import type React from "react"

import { useEffect, useRef } from "react"

type KeyHandler = (e: KeyboardEvent) => void
type KeyMap = Record<string, KeyHandler>

/**
 * Hook to manage keyboard shortcuts
 * @param keyMap Object mapping key names to handler functions
 * @param deps Dependencies array to control when shortcuts are refreshed
 * @param options Configuration options
 */
export function useKeyboardShortcut(
  keyMap: KeyMap,
  deps: React.DependencyList = [],
  options: {
    enabled?: boolean
    preventDefault?: boolean
    ignoreInputFields?: boolean
    ignoreModifiers?: boolean
  } = {},
) {
  const { enabled = true, preventDefault = true, ignoreInputFields = true, ignoreModifiers = false } = options

  // Store keyMap in a ref to prevent recreating the handler on every render
  const keyMapRef = useRef<KeyMap>(keyMap)

  // Update the ref when keyMap changes
  useEffect(() => {
    keyMapRef.current = keyMap
  }, [keyMap])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if target is an input, textarea, or select unless configured otherwise
      if (ignoreInputFields) {
        const target = e.target as HTMLElement
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        ) {
          return
        }
      }

      // Ignore if modifier keys are pressed unless configured otherwise
      if (ignoreModifiers && (e.ctrlKey || e.altKey || e.metaKey)) {
        return
      }

      // Safely handle the key, ensuring it exists before calling toLowerCase()
      const key = e.key ? e.key.toLowerCase() : ""
      const handler = keyMapRef.current[key]

      if (handler) {
        if (preventDefault) {
          e.preventDefault()
        }
        handler(e)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enabled, preventDefault, ignoreInputFields, ignoreModifiers, ...deps])
}
