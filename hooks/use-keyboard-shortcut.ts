"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcutOptions {
  preventDefault?: boolean
  stopPropagation?: boolean
  enabled?: boolean
}

export function useKeyboardShortcut(
  keys: string | string[],
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {},
  deps: any[] = [],
) {
  const { preventDefault = true, stopPropagation = false, enabled = true } = options

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const targetKeys = Array.isArray(keys) ? keys : [keys]
      const pressedKey = event.key

      // Check for modifier keys
      const hasCtrl = event.ctrlKey || event.metaKey
      const hasShift = event.shiftKey
      const hasAlt = event.altKey

      const matchesShortcut = targetKeys.some((key) => {
        // Handle simple keys
        if (key === pressedKey) return true

        // Handle modifier combinations
        if (key.includes("+")) {
          const parts = key.split("+").map((part) => part.trim().toLowerCase())
          const keyPart = parts[parts.length - 1]
          const modifiers = parts.slice(0, -1)

          if (pressedKey.toLowerCase() !== keyPart) return false

          const needsCtrl = modifiers.includes("ctrl") || modifiers.includes("cmd")
          const needsShift = modifiers.includes("shift")
          const needsAlt = modifiers.includes("alt")

          return (
            (!needsCtrl || hasCtrl) &&
            (!needsShift || hasShift) &&
            (!needsAlt || hasAlt) &&
            (needsCtrl ? hasCtrl : true) &&
            (needsShift ? hasShift : true) &&
            (needsAlt ? hasAlt : true)
          )
        }

        return false
      })

      if (matchesShortcut) {
        if (preventDefault) event.preventDefault()
        if (stopPropagation) event.stopPropagation()
        callback(event)
      }
    },
    [keys, callback, preventDefault, stopPropagation, enabled, ...deps],
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress, enabled])
}

export default useKeyboardShortcut
