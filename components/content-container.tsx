"use client"

import type { ReactNode } from "react"

interface ContentContainerProps {
  children: ReactNode
  isActive: boolean
}

export default function ContentContainer({ children, isActive }: ContentContainerProps) {
  if (!isActive) return null

  return <div className="animate-in fade-in-50 duration-300">{children}</div>
}
