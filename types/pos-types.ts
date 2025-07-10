export interface Product {
  id: string
  name: string
  price: number
  costPrice?: number
  category: string
  imageUrl?: string
  barcode?: string
  stock?: number
  minStockLevel?: number
  maxStockLevel?: number
  isManualEntry?: boolean
  quickAdd?: boolean
  tags?: string[]
  trackingCategory?: "general" | "alcohol" | "tobacco" | "high-value" | "controlled" | "perishable"
  isTrackable?: boolean
  unitsSold?: number
  createdAt: Date
  updatedAt: Date
  customPrice?: boolean
}

export interface CartItem {
  product: Product
  quantity: number
  subtotal?: number
}

export interface Discount {
  type: "percentage" | "fixed"
  value: number
  description: string
  code?: string
  minAmount?: number
  maxAmount?: number
  validFrom?: Date
  validTo?: Date
}

export interface Transaction {
  id: string
  items: CartItem[]
  subtotal: number
  discount?: Discount
  discountAmount?: number
  tax: number
  total: number
  timestamp: Date
  paymentMethod: PaymentMethod
  isReturn: boolean
  taxApplied: boolean
  amountTendered?: number
  changeDue?: number
  currency: string
  status: TransactionStatus
}

export interface TransactionTotals {
  subtotal: number
  discountAmount: number
  tax: number
  total: number
}

export type PaymentMethod = "cash" | "card" | "digital" | "check" | "store_credit"

export type TransactionStatus = "pending" | "completed" | "cancelled" | "refunded" | "partial_refund"

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock"

export interface StockAlert {
  id: string
  productId: string
  productName: string
  currentStock: number
  minStockLevel: number
  category?: string
  trackingCategory?: string
  isActive: boolean
  createdAt: Date
  acknowledgedAt?: Date
}

export interface ProductSalesReport {
  productId: string
  productName: string
  category: string
  trackingCategory?: string
  currentStock: number
  minStockLevel: number
  unitsSold: number
  totalRevenue: number
  averagePrice: number
  lastSold?: Date
  stockStatus: StockStatus
  daysOfStock?: number
}

export interface ProductFilters {
  category?: string
  trackingCategory?: string
  stockStatus?: StockStatus
  priceRange?: [number, number]
  search?: string
}

export interface ServiceError {
  type: "validation" | "database" | "network" | "not_found" | "permission" | "unknown"
  message: string
  details?: any
  code?: number
}

export interface ServiceResponse<T> {
  data: T | null
  error: ServiceError | null
}
