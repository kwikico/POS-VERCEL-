// A simple in-memory cache for barcode lookups to reduce database queries
// This will significantly improve performance for frequently scanned products

type CacheEntry<T> = {
  value: T
  timestamp: number
}

class BarcodeCache {
  private cache: Map<string, CacheEntry<boolean>> = new Map()
  private readonly TTL: number = 1000 * 60 * 60 // 1 hour cache TTL

  // Check if a barcode exists in the cache
  has(barcode: string): boolean {
    if (!this.cache.has(barcode)) {
      return false
    }

    const entry = this.cache.get(barcode)!
    const now = Date.now()

    // Check if the entry has expired
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(barcode)
      return false
    }

    return true
  }

  // Get a cached barcode result
  get(barcode: string): boolean | null {
    if (!this.has(barcode)) {
      return null
    }

    return this.cache.get(barcode)!.value
  }

  // Set a barcode result in the cache
  set(barcode: string, exists: boolean): void {
    this.cache.set(barcode, {
      value: exists,
      timestamp: Date.now(),
    })
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear()
  }

  // Get the size of the cache
  size(): number {
    return this.cache.size
  }

  // Clean expired entries (can be called periodically)
  cleanExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key)
      }
    }
  }
}

// Export a singleton instance
export const barcodeCache = new BarcodeCache()
