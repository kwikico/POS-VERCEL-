/**
 * Type-safe wrapper for localStorage
 */

// Get item from localStorage with type safety
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error)
    return defaultValue
  }
}

// Set item in localStorage with type safety
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error)
  }
}

// Remove item from localStorage
export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error)
  }
}
