export interface Product {
  id: string
  name: string
  price: number
  category: string
  imageUrl: string
  barcode?: string
  stock?: number
  isManualEntry?: boolean
  quickAdd?: boolean
  customPrice?: boolean
  tags?: string[]
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Discount {
  type: "percentage" | "fixed"
  value: number
  description: string
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
  paymentMethod: string
  isReturn: boolean
  taxApplied: boolean
}
