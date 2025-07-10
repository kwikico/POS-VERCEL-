interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize: number

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
  }

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new Cache()

export const cacheKeys = {
  products: () => "products:all",
  productById: (id: string) => `product:${id}`,
  productByBarcode: (barcode: string) => `product:barcode:${barcode}`,
  transactions: () => "transactions:all",
  transactionById: (id: string) => `transaction:${id}`,
  reports: (type: string, params: string) => `report:${type}:${params}`,
  stockAlerts: () => "stock:alerts",
}

// Cleanup expired items every 5 minutes
setInterval(
  () => {
    cache.cleanup()
  },
  5 * 60 * 1000,
)

export default cache
