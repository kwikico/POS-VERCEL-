// Application Configuration
export const APP_CONFIG = {
  // Business settings
  BUSINESS: {
    NAME: "Kwiki Mart",
    ADDRESS: "123 Main Street, City, State 12345",
    PHONE: "(555) 123-4567",
    EMAIL: "info@kwikimart.com",
    TAX_ID: "123-45-6789",
    DEFAULT_TAX_RATE: 0.13, // 13% HST for Canada
    MAX_CART_ITEMS: 100,
    MAX_TRANSACTION_AMOUNT: 10000,
    CURRENCY: "CAD",
    TIMEZONE: "America/Toronto",
  },

  // Validation rules
  VALIDATION: {
    MIN_PRICE: 0,
    MAX_PRICE: 9999.99,
    MIN_STOCK: 0,
    MAX_STOCK: 99999,
    MIN_BARCODE_LENGTH: 1,
    MAX_BARCODE_LENGTH: 50,
    MAX_PRODUCT_NAME_LENGTH: 100,
    MAX_CATEGORY_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
  },

  // UI settings
  UI: {
    ITEMS_PER_PAGE: 20,
    SEARCH_DEBOUNCE_MS: 300,
    TOAST_DURATION: 3000,
    ANIMATION_DURATION: 200,
    MAX_RECENT_TRANSACTIONS: 50,
  },

  // Cache settings
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    PRODUCTS_TTL: 10 * 60 * 1000, // 10 minutes
    TRANSACTIONS_TTL: 2 * 60 * 1000, // 2 minutes
    REPORTS_TTL: 15 * 60 * 1000, // 15 minutes
  },

  // Feature flags
  FEATURES: {
    ENABLE_BARCODE_SCANNING: true,
    ENABLE_INVENTORY_TRACKING: true,
    ENABLE_DISCOUNTS: true,
    ENABLE_RETURNS: true,
    ENABLE_REPORTS: true,
    ENABLE_MULTI_PAYMENT: false,
    ENABLE_CUSTOMER_ACCOUNTS: false,
  },

  // API settings
  API: {
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },
}

// Currency configuration
export const CURRENCY = {
  CODE: "CAD",
  SYMBOL: "$",
  DECIMAL_PLACES: 2,
  THOUSANDS_SEPARATOR: ",",
  DECIMAL_SEPARATOR: ".",
}

// Tax configuration
export const TAX_RATE = APP_CONFIG.BUSINESS.DEFAULT_TAX_RATE

// Toast duration
export const TOAST_DURATION = APP_CONFIG.UI.TOAST_DURATION

// Storage keys for localStorage
export const STORAGE_KEYS = {
  CART: "pos_cart",
  SETTINGS: "pos_settings",
  USER_PREFERENCES: "pos_user_preferences",
  RECENT_TRANSACTIONS: "pos_recent_transactions",
  CACHED_PRODUCTS: "pos_cached_products",
  LAST_SYNC: "pos_last_sync",
  OFFLINE_QUEUE: "pos_offline_queue",
  THEME: "pos_theme",
  LANGUAGE: "pos_language",
  KEYBOARD_SHORTCUTS: "pos_keyboard_shortcuts",
}

// Payment methods
export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  DIGITAL: "digital",
  CHECK: "check",
  STORE_CREDIT: "store_credit",
} as const

// Transaction statuses
export const TRANSACTION_STATUSES = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIAL_REFUND: "partial_refund",
} as const

// Stock statuses
export const STOCK_STATUSES = {
  IN_STOCK: "in-stock",
  LOW_STOCK: "low-stock",
  OUT_OF_STOCK: "out-of-stock",
} as const

// Product categories
export const PRODUCT_CATEGORIES = [
  "Beverages",
  "Snacks",
  "Dairy",
  "Bakery",
  "Frozen",
  "Meat",
  "Produce",
  "Household",
  "Personal Care",
  "Electronics",
  "Tobacco",
  "Alcohol",
  "Pharmacy",
  "Automotive",
  "Seasonal",
  "Uncategorized",
]

// Discount types
export const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
} as const

// Report types
export const REPORT_TYPES = {
  SALES: "sales",
  INVENTORY: "inventory",
  PRODUCTS: "products",
  TRANSACTIONS: "transactions",
  TAX: "tax",
  PROFIT: "profit",
} as const

// Date ranges for reports
export const DATE_RANGES = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "this_week",
  LAST_WEEK: "last_week",
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  THIS_YEAR: "this_year",
  CUSTOM: "custom",
} as const

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
  SERVER_ERROR: "Server error occurred. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  PERMISSION_ERROR: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested item was not found.",
  DUPLICATE_ERROR: "This item already exists.",
  INSUFFICIENT_STOCK: "Insufficient stock available.",
  INVALID_BARCODE: "Invalid barcode format.",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  SAVE_FAILED: "Failed to save changes.",
  DELETE_FAILED: "Failed to delete item.",
  LOAD_FAILED: "Failed to load data.",
}

// Success messages
export const SUCCESS_MESSAGES = {
  ITEM_ADDED: "Item added successfully.",
  ITEM_UPDATED: "Item updated successfully.",
  ITEM_DELETED: "Item deleted successfully.",
  TRANSACTION_COMPLETED: "Transaction completed successfully.",
  PAYMENT_PROCESSED: "Payment processed successfully.",
  INVENTORY_UPDATED: "Inventory updated successfully.",
  SETTINGS_SAVED: "Settings saved successfully.",
  BACKUP_CREATED: "Backup created successfully.",
  DATA_IMPORTED: "Data imported successfully.",
  SYNC_COMPLETED: "Data synchronized successfully.",
}

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_TRANSACTION: "F1",
  CHECKOUT: "F2",
  CLEAR_CART: "F3",
  SEARCH_PRODUCTS: "F4",
  INVENTORY: "F5",
  REPORTS: "F6",
  SETTINGS: "F7",
  HELP: "F8",
  BARCODE_SCAN: "F9",
  QUICK_CASH: "F10",
  ESCAPE: "Escape",
  ENTER: "Enter",
}

// API endpoints
export const API_ENDPOINTS = {
  PRODUCTS: "/api/products",
  TRANSACTIONS: "/api/transactions",
  INVENTORY: "/api/inventory",
  REPORTS: "/api/reports",
  SETTINGS: "/api/settings",
  BACKUP: "/api/backup",
  SYNC: "/api/sync",
  HEALTH: "/api/health",
}

// Default settings
export const DEFAULT_SETTINGS = {
  theme: "light",
  language: "en",
  currency: CURRENCY.CODE,
  taxRate: TAX_RATE,
  autoSave: true,
  soundEnabled: true,
  keyboardShortcuts: true,
  showTooltips: true,
  compactMode: false,
  printReceipts: true,
  emailReceipts: false,
  inventoryTracking: true,
  lowStockAlerts: true,
  backupFrequency: "daily",
  syncFrequency: "hourly",
}

// Export all constants
export default {
  APP_CONFIG,
  CURRENCY,
  TAX_RATE,
  TOAST_DURATION,
  STORAGE_KEYS,
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
  STOCK_STATUSES,
  PRODUCT_CATEGORIES,
  DISCOUNT_TYPES,
  REPORT_TYPES,
  DATE_RANGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  KEYBOARD_SHORTCUTS,
  API_ENDPOINTS,
  DEFAULT_SETTINGS,
}
