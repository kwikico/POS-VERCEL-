import { z } from "zod"
import { APP_CONFIG } from "./constants"
import type { Product, Transaction, CartItem, Discount } from "@/types/pos-types"

// Product validation schema
export const productSchema = z
  .object({
    id: z.string().min(1, "Product ID is required"),
    name: z
      .string()
      .min(1, "Product name is required")
      .max(
        APP_CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH,
        `Product name must be less than ${APP_CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH} characters`,
      ),
    price: z.number().min(0, "Price cannot be negative"),
    costPrice: z.number().min(0).nullable().optional(),
    category: z.preprocess(
      (val) => (val === null || val === undefined || val === "" ? "Uncategorized" : val),
      z
        .string()
        .min(1, "Category is required")
        .max(
          APP_CONFIG.VALIDATION.MAX_CATEGORY_LENGTH,
          `Category must be less than ${APP_CONFIG.VALIDATION.MAX_CATEGORY_LENGTH} characters`,
        ),
    ),
    // Accept absolute URLs (http/https) *or* app-relative paths starting with "/"
    imageUrl: z
      .preprocess(
        (val) => (val === null ? undefined : val),
        z
          .string()
          .min(1, "Image URL cannot be empty")
          .refine(
            (v) => /^https?:\/\//.test(v) || v.startsWith("/"),
            "Invalid image URL – must be an http(s) URL or start with " / "",
          ),
      )
      .optional(),
    // Accept null → undefined for optional string fields
    barcode: z.preprocess((val) => (val === null ? undefined : val), z.string()).optional(),

    // Accept null → undefined for optional enum field
    trackingCategory: z
      .preprocess(
        (val) => (val === null ? undefined : val),
        z.enum(["general", "alcohol", "tobacco", "high-value", "controlled", "perishable"]),
      )
      .optional(),

    // Accept null → undefined for optional tags array
    tags: z.preprocess((val) => (val === null ? undefined : val), z.array(z.string())).optional(),
    stock: z.number().int("Stock must be a whole number").min(0).nullable().optional(),
    minStockLevel: z.number().int("Minimum stock level must be a whole number").min(0).nullable().optional(),
    maxStockLevel: z.number().int("Maximum stock level must be a whole number").min(0).nullable().optional(),
    isManualEntry: z.boolean().optional(),
    quickAdd: z.boolean().optional(),
    isTrackable: z.boolean().optional(),
    unitsSold: z.number().int().min(0).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  })
  .refine(
    (data) => {
      // Cost price should not exceed selling price
      if (data.costPrice && data.costPrice > data.price) {
        return false
      }
      return true
    },
    {
      message: "Cost price cannot exceed selling price",
      path: ["costPrice"],
    },
  )
  .refine(
    (data) => {
      // If price is 0 we only allow it for flagged custom-price items
      if (data.price === 0) {
        return data.customPrice === true || data.category === "custom-price"
      }
      return true
    },
    {
      message: "Price of $0 is only allowed for custom-price products",
      path: ["price"],
    },
  )
  .refine(
    (data) => {
      // Max stock level should be greater than min stock level
      if (data.minStockLevel && data.maxStockLevel && data.maxStockLevel <= data.minStockLevel) {
        return false
      }
      return true
    },
    {
      message: "Maximum stock level must be greater than minimum stock level",
      path: ["maxStockLevel"],
    },
  )

// Cart item validation schema
export const cartItemSchema = z.object({
  product: productSchema,
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(1000, "Quantity cannot exceed 1000"),
  subtotal: z.number().min(0).optional(),
})

// Discount validation schema
export const discountSchema = z
  .object({
    type: z.enum(["percentage", "fixed"]),
    value: z.number().min(0, "Discount value cannot be negative"),
    description: z.string().min(1, "Discount description is required"),
    code: z.string().optional(),
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().min(0).optional(),
    validFrom: z.date().optional(),
    validTo: z.date().optional(),
  })
  .refine(
    (data) => {
      // Percentage discounts should not exceed 100%
      if (data.type === "percentage" && data.value > 100) {
        return false
      }
      return true
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      // Valid from should be before valid to
      if (data.validFrom && data.validTo && data.validFrom >= data.validTo) {
        return false
      }
      return true
    },
    {
      message: "Valid from date must be before valid to date",
      path: ["validTo"],
    },
  )

// Transaction validation schema
export const transactionSchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
  items: z.array(cartItemSchema).min(1, "Transaction must have at least one item"),
  subtotal: z.number().min(0, "Subtotal cannot be negative"),
  discount: discountSchema.optional(),
  discountAmount: z.number().min(0).optional(),
  tax: z.number().min(0, "Tax cannot be negative"),
  total: z.number().min(0, "Total cannot be negative"),
  timestamp: z.date(),
  paymentMethod: z.enum(["cash", "card", "digital", "check", "store_credit"]),
  isReturn: z.boolean(),
  taxApplied: z.boolean(),
  amountTendered: z.number().min(0).optional(),
  changeDue: z.number().min(0).optional(),
  currency: z.string().min(1, "Currency is required"),
  status: z.enum(["pending", "completed", "cancelled", "refunded", "partial_refund"]),
})

// Barcode validation
export const barcodeSchema = z
  .string()
  .min(1, "Barcode cannot be empty")
  .max(50, "Barcode cannot exceed 50 characters")
  .regex(/^[0-9A-Za-z\-_]+$/, "Barcode can only contain letters, numbers, hyphens, and underscores")

// Price validation
export const priceSchema = z
  .number()
  .min(APP_CONFIG.VALIDATION.MIN_PRICE, `Price must be at least $${APP_CONFIG.VALIDATION.MIN_PRICE}`)
  .max(APP_CONFIG.VALIDATION.MAX_PRICE, `Price cannot exceed $${APP_CONFIG.VALIDATION.MAX_PRICE}`)

// Stock validation
export const stockSchema = z
  .number()
  .int("Stock must be a whole number")
  .min(APP_CONFIG.VALIDATION.MIN_STOCK, "Stock cannot be negative")
  .max(APP_CONFIG.VALIDATION.MAX_STOCK, `Stock cannot exceed ${APP_CONFIG.VALIDATION.MAX_STOCK}`)

// Validation functions
export function validateProduct(
  product: any,
): { success: true; data: Product } | { success: false; error: z.ZodError } {
  const result = productSchema.safeParse(product)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function validateCartItem(item: any): { success: true; data: CartItem } | { success: false; error: z.ZodError } {
  const result = cartItemSchema.safeParse(item)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function validateDiscount(
  discount: any,
): { success: true; data: Discount } | { success: false; error: z.ZodError } {
  const result = discountSchema.safeParse(discount)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function validateTransaction(
  transaction: any,
): { success: true; data: Transaction } | { success: false; error: z.ZodError } {
  const result = transactionSchema.safeParse(transaction)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function validateBarcode(barcode: any): { success: true; data: string } | { success: false; error: z.ZodError } {
  const result = barcodeSchema.safeParse(barcode)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function validatePrice(price: any): { success: true; data: number } | { success: false; error: z.ZodError } {
  const result = priceSchema.safeParse(price)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function validateStock(stock: any): { success: true; data: number } | { success: false; error: z.ZodError } {
  const result = stockSchema.safeParse(stock)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

export function sanitizeNumber(input: any): number | null {
  const num = Number(input)
  return isNaN(num) ? null : num
}

export function sanitizeBarcode(barcode: string): string {
  return barcode
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z\-_]/g, "")
}

// Business rule validations
export function validateStockOperation(currentStock: number, operation: number): boolean {
  const newStock = currentStock + operation
  return newStock >= 0 && newStock <= APP_CONFIG.VALIDATION.MAX_STOCK
}

export function validateDiscountApplication(subtotal: number, discount: Discount): boolean {
  if (discount.minAmount && subtotal < discount.minAmount) {
    return false
  }
  if (discount.maxAmount && subtotal > discount.maxAmount) {
    return false
  }
  if (discount.validFrom && new Date() < discount.validFrom) {
    return false
  }
  if (discount.validTo && new Date() > discount.validTo) {
    return false
  }
  return true
}

export function validatePaymentAmount(total: number, amountTendered: number): boolean {
  return amountTendered >= total
}
