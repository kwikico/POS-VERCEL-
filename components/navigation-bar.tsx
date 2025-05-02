"use client"

import type React from "react"

import { memo, useEffect, useState } from "react"
import { ShoppingCartIcon, Package, BarChart3, CuboidIcon as Cube, ReceiptIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onNewTransaction: () => void
  hasReceipt: boolean
}

function NavigationBarComponent({ activeTab, onTabChange, onNewTransaction, hasReceipt }: NavigationBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Format date as MM/DD/YYYY
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })

  // Format time as HH:MM AM/PM
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  const handleTabChange = (tab: string) => {
    if (activeTab !== "receipt" || tab === "receipt") {
      onTabChange(tab)
    }
  }

  return (
    <header className="bg-gradient-to-r from-[#007bff] to-[#ff5ca8] text-white shadow-md sticky top-0 z-50">
      <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left side - Logo and brand name */}
          <div className="flex items-center">
            <div className="bg-white text-[#007bff] rounded-full p-2 mr-3 shadow-lg">
              <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="text-xl sm:text-2xl font-bold cursor-pointer" onClick={onNewTransaction}>
              KWIKI CONVENIENCE
            </div>
          </div>

          {/* Center - Navigation buttons */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-3">
            <NavButton
              icon={<Package className="h-4 w-4 sm:mr-2" />}
              label="Point of Sale"
              isActive={activeTab === "pos"}
              onClick={() => handleTabChange("pos")}
              shortcut="F1"
            />

            <NavButton
              icon={<BarChart3 className="h-4 w-4 sm:mr-2" />}
              label="Reports"
              isActive={activeTab === "reports"}
              onClick={() => handleTabChange("reports")}
              shortcut="F2"
            />

            <NavButton
              icon={<Cube className="h-4 w-4 sm:mr-2" />}
              label="Inventory"
              isActive={activeTab === "inventory"}
              onClick={() => handleTabChange("inventory")}
              shortcut="F3"
            />

            <NavButton
              icon={<ReceiptIcon className="h-4 w-4 sm:mr-2" />}
              label="Receipt"
              isActive={activeTab === "receipt"}
              isDisabled={!hasReceipt}
              onClick={() => hasReceipt && handleTabChange("receipt")}
              shortcut="F4"
            />
          </div>

          {/* Right side - Date and time */}
          <div className="text-xs sm:text-sm bg-white/20 px-3 py-1 rounded-full whitespace-nowrap">
            {formattedDate} {formattedTime}
          </div>
        </div>
      </div>
    </header>
  )
}

// Reusable navigation button component
interface NavButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  isDisabled?: boolean
  onClick: () => void
  shortcut?: string
}

function NavButton({ icon, label, isActive, isDisabled = false, onClick, shortcut }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "flex flex-col sm:flex-row items-center px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors relative",
        isActive
          ? "bg-white/20 text-white"
          : isDisabled
            ? "text-white/40 cursor-not-allowed"
            : "text-white/80 hover:bg-white/10",
      )}
    >
      {icon}
      <span className="text-xs sm:text-sm">{label}</span>
      {shortcut && (
        <span className="absolute -top-1 -right-1 text-[10px] bg-white/30 px-1 rounded hidden sm:block">
          {shortcut}
        </span>
      )}
    </button>
  )
}

// Use memo to prevent unnecessary re-renders
export default memo(NavigationBarComponent)
