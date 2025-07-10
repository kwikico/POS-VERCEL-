import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { APP_CONFIG, CURRENCY } from "./constants"
import type { Product, Transaction, CartItem, StockStatus } from "@/types/pos-types"

// Utility function for combining class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY.CODE,
    minimumFractionDigits: CURRENCY.DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY.DECIMAL_PLACES,
  }).format(amount)
}

// Number formatting
export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

// Percentage formatting
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// Date formatting
export function formatDate(date: Date | string, format = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date

  switch (format) {
    case "short":
      return d.toLocaleDateString()
    case "long":
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    case "time":
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    case "datetime":
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    default:
      return d.toLocaleDateString()
  }
}

// Time ago formatting
export function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const past = typeof date === "string" ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return formatDate(past, "short")
}

// String utilities
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-$$$$]{10,}$/
  return phoneRegex.test(phone)
}

export function isValidBarcode(barcode: string): boolean {
  return (
    barcode.length >= APP_CONFIG.VALIDATION.MIN_BARCODE_LENGTH &&
    barcode.length <= APP_CONFIG.VALIDATION.MAX_BARCODE_LENGTH &&
    /^[0-9A-Za-z\-_]+$/.test(barcode)
  )
}

// Math utilities
export function roundToDecimals(num: number, decimals: number): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export function calculatePercentage(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100
}

export function calculateDiscount(price: number, discountType: "percentage" | "fixed", discountValue: number): number {
  if (discountType === "percentage") {
    return (price * discountValue) / 100
  }
  return Math.min(discountValue, price)
}

// POS-specific calculations
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
}

export function calculateTax(subtotal: number, taxRate: number = APP_CONFIG.BUSINESS.DEFAULT_TAX_RATE): number {
  return subtotal * taxRate
}

export function calculateTotal(subtotal: number, tax: number, discountAmount = 0): number {
  return Math.max(0, subtotal + tax - discountAmount)
}

export function calculateChange(total: number, amountPaid: number): number {
  return Math.max(0, amountPaid - total)
}

// Stock status utilities
export function getStockStatus(currentStock: number, minStockLevel?: number): StockStatus {
  if (currentStock === 0) return "out-of-stock"
  if (minStockLevel && currentStock <= minStockLevel) return "low-stock"
  return "in-stock"
}

export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case "out-of-stock":
      return "text-red-600 bg-red-50"
    case "low-stock":
      return "text-yellow-600 bg-yellow-50"
    case "in-stock":
      return "text-green-600 bg-green-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    },
    {} as Record<string, T[]>,
  )
}

export function sortBy<T>(array: T[], key: keyof T, direction: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal < bVal) return direction === "asc" ? -1 : 1
    if (aVal > bVal) return direction === "asc" ? 1 : -1
    return 0
  })
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Local storage utilities
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn(`Failed to get ${key} from localStorage:`, error)
    return defaultValue
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Failed to set ${key} to localStorage:`, error)
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn(`Failed to remove ${key} from localStorage:`, error)
  }
}

// Performance measurement
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`${name} took ${(end - start).toFixed(2)}ms`)
  return result
}

// Type guards
export function isProduct(obj: any): obj is Product {
  return obj && typeof obj.id === "string" && typeof obj.name === "string" && typeof obj.price === "number"
}

export function isTransaction(obj: any): obj is Transaction {
  return obj && typeof obj.id === "string" && Array.isArray(obj.items) && typeof obj.total === "number"
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unknown error occurred"
}

export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("connection"))
  )
}

// Random utilities
export function generateId(prefix = ""): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}${timestamp}_${random}`
}

export function generateBarcode(): string {
  return Math.random().toString().substr(2, 12)
}

// Search utilities
export function fuzzySearch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()

  let queryIndex = 0
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    }
  }

  return queryIndex === queryLower.length
}

// Highlight every match of `query` inside `text` by wrapping it in <mark> tags.
// This escapes any RegExp-special characters so user input can never break
// the pattern (fixes “Invalid regular expression: missing /” runtime error).
export function highlightText(text: string, query: string): string {
  if (!query) return text

  // Escape characters that have special meaning in RegExp: .*+?^${}()|[]\
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  // Build a case-insensitive, global search for the (now safe) query
  const regex = new RegExp(`(${escapedQuery})`, "gi")

  return text.replace(regex, "<mark>$1</mark>")
}

// File utilities
export function downloadAsJson(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadAsCsv(data: any[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
