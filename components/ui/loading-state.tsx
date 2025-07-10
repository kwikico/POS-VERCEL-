"use client"

import type React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingState({ message = "Loading...", size = "md", className }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <Loader2 className={cn("animate-spin text-slate-400", sizeClasses[size])} />
      {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}
    </div>
  )
}

// Loading button component
interface LoadingButtonProps {
  isLoading?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export function LoadingButton({ isLoading = false, children, className, disabled, onClick }: LoadingButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md",
        "bg-blue-600 text-white hover:bg-blue-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading?: boolean
  text?: string
  children: React.ReactNode
  className?: string
}

export function LoadingOverlay({ isLoading = false, text = "Loading...", children, className }: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <LoadingState message={text} />
        </div>
      )}
    </div>
  )
}

// Skeleton components for specific use cases
export function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
    </div>
  )
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Loading states for specific components
export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4 border rounded">
          <div className="h-12 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border rounded-lg p-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
          </div>
        ))}
      </div>
      <div className="border rounded-lg p-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4 mb-4" />
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  )
}

export default LoadingState
