import { cache } from "@/lib/cache"

class BarcodeCache {
  private cacheKey = "barcode:exists:"

  set(barcode: string, exists: boolean): void {
    cache.set(`${this.cacheKey}${barcode}`, exists, 30 * 60 * 1000) // 30 minutes
  }

  get(barcode: string): boolean | null {
    return cache.get<boolean>(`${this.cacheKey}${barcode}`)
  }

  has(barcode: string): boolean {
    return cache.has(`${this.cacheKey}${barcode}`)
  }

  delete(barcode: string): void {
    cache.delete(`${this.cacheKey}${barcode}`)
  }

  clear(): void {
    // Clear all barcode cache entries
    const keys = Array.from((cache as any).cache.keys()).filter((key: string) => key.startsWith(this.cacheKey))
    keys.forEach((key) => cache.delete(key))
  }
}

export const barcodeCache = new BarcodeCache()
export default barcodeCache
