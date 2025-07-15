"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  AlertTriangle,
  Package,
  BellOff,
  Loader2,
  Download,
  Search,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"
import type { Product, StockAlert, ProductSalesReport } from "@/types/pos-types"
import {
  getProductSalesReport,
  getStockAlerts,
  acknowledgeStockAlert,
  updateProductStockSettings,
} from "@/services/stock-service"

interface ProductReportingProps {
  products: Product[]
  onProductsChange: (products: Product[]) => void
}

interface RestockingRecommendation {
  productId: string
  productName: string
  currentStock: number
  recommendedOrder: number
  daysUntilStockout: number
  priority: "high" | "medium" | "low"
  estimatedCost: number
  potentialRevenue: number
  profitMargin: number
}

export default function ProductReporting({ products, onProductsChange }: ProductReportingProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState("last30days")
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedTrackingCategory, setSelectedTrackingCategory] = useState<string>("all")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [salesReports, setSalesReports] = useState<ProductSalesReport[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [restockingDialogOpen, setRestockingDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [minStockLevel, setMinStockLevel] = useState<string>("")
  const [trackingCategory, setTrackingCategory] = useState<string>("")
  const [alertThreshold, setAlertThreshold] = useState<number>(7) // Days before stockout
  const [showProfitableOnly, setShowProfitableOnly] = useState(false)

  function getDefaultStartDate() {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split("T")[0]
  }

  // Load data when filters change
  useEffect(() => {
    loadReportData()
    loadStockAlerts()
  }, [dateRange, startDate, endDate, selectedCategory, selectedTrackingCategory, selectedProducts])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      const start = dateRange === "custom" ? new Date(startDate) : getStartDateForRange(dateRange)
      const end = dateRange === "custom" ? new Date(endDate) : new Date()

      const { data, error } = await getProductSalesReport(start, end, selectedCategory, selectedTrackingCategory)

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setSalesReports(data || [])
      }
    } catch (error) {
      console.error("Error loading report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStockAlerts = async () => {
    try {
      const { data, error } = await getStockAlerts()
      if (error) {
        console.error("Error loading stock alerts:", error)
      } else {
        setStockAlerts(data || [])
      }
    } catch (error) {
      console.error("Error loading stock alerts:", error)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await acknowledgeStockAlert(alertId)
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Alert Acknowledged",
          description: "Stock alert has been acknowledged.",
        })
        loadStockAlerts()
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error)
    }
  }

  const handleUpdateStockSettings = async () => {
    if (!selectedProduct) return

    try {
      const minLevel = Number.parseInt(minStockLevel)
      if (isNaN(minLevel) || minLevel < 0) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid minimum stock level.",
          variant: "destructive",
        })
        return
      }

      const { error } = await updateProductStockSettings(selectedProduct.id, minLevel, trackingCategory || undefined)

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Settings Updated",
          description: "Product stock settings have been updated.",
        })

        // Update local products
        const updatedProducts = products.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, minStockLevel: minLevel, trackingCategory: trackingCategory as any }
            : p,
        )
        onProductsChange(updatedProducts)

        setSettingsDialogOpen(false)
        loadReportData()
        loadStockAlerts()
      }
    } catch (error) {
      console.error("Error updating stock settings:", error)
    }
  }

  function getStartDateForRange(range: string): Date {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (range) {
      case "today":
        return today
      case "last7days":
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)
        return lastWeek
      case "last30days":
        const lastMonth = new Date(today)
        lastMonth.setDate(lastMonth.getDate() - 30)
        return lastMonth
      case "last90days":
        const last90Days = new Date(today)
        last90Days.setDate(last90Days.getDate() - 90)
        return last90Days
      default:
        return lastMonth
    }
  }

  const openStockSettings = (product: Product) => {
    setSelectedProduct(product)
    setMinStockLevel((product.minStockLevel || 0).toString())
    setTrackingCategory(product.trackingCategory || "general")
    setSettingsDialogOpen(true)
  }

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts((prev) => [...prev, productId])
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId))
    }
  }

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  // Get unique, non-empty categories
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => !!c && c.trim() !== "")),
  )
  const trackingCategories = [
    "alcohol",
    "tobacco",
    "high-value",
    "controlled",
    "general",
    "food",
    "electronics",
    "clothing",
    "health",
    "household",
  ]

  // Filter products based on search and selection
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.tags && product.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      const matchesTracking =
        selectedTrackingCategory === "all" ||
        (product.tags && product.tags.includes(selectedTrackingCategory)) ||
        product.trackingCategory === selectedTrackingCategory

      return matchesSearch && matchesCategory && matchesTracking
    })
  }, [products, searchTerm, selectedCategory, selectedTrackingCategory])

  // Filter reports based on selected products
  const filteredReports = useMemo(() => {
    let reports = salesReports.filter((report) => {
      if (selectedCategory !== "all" && report.category !== selectedCategory) return false
      if (selectedTrackingCategory !== "all" && report.trackingCategory !== selectedTrackingCategory) return false
      if (selectedProducts.length > 0 && !selectedProducts.includes(report.productId)) return false
      if (showProfitableOnly && report.totalRevenue <= 0) return false
      return true
    })

    if (searchTerm) {
      reports = reports.filter(
        (report) =>
          report.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return reports
  }, [salesReports, selectedCategory, selectedTrackingCategory, selectedProducts, searchTerm, showProfitableOnly])

  // Generate restocking recommendations
  const restockingRecommendations = useMemo((): RestockingRecommendation[] => {
    return filteredReports
      .map((report) => {
        const product = products.find((p) => p.id === report.productId)
        const costPrice = product?.costPrice || 0
        const sellingPrice = product?.price || 0
        const profitMargin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0

        // Calculate days until stockout based on average daily sales
        const avgDailySales = report.unitsSold / 30 // Assuming 30-day period
        const daysUntilStockout = avgDailySales > 0 ? Math.floor(report.currentStock / avgDailySales) : 999

        // Recommend ordering enough for 30 days plus buffer
        const recommendedOrder = Math.max(0, Math.ceil(avgDailySales * 30) - report.currentStock)

        // Determine priority
        let priority: "high" | "medium" | "low" = "low"
        if (daysUntilStockout <= 3 || report.stockStatus === "out-of-stock") {
          priority = "high"
        } else if (daysUntilStockout <= 7 || report.stockStatus === "low-stock") {
          priority = "medium"
        }

        return {
          productId: report.productId,
          productName: report.productName,
          currentStock: report.currentStock,
          recommendedOrder,
          daysUntilStockout,
          priority,
          estimatedCost: recommendedOrder * costPrice,
          potentialRevenue: recommendedOrder * sellingPrice,
          profitMargin,
        }
      })
      .filter((rec) => rec.recommendedOrder > 0 || rec.priority === "high")
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }, [filteredReports, products])

  // Calculate summary stats
  const totalProducts = filteredReports.length
  const lowStockProducts = filteredReports.filter((r) => r.stockStatus === "low-stock").length
  const outOfStockProducts = filteredReports.filter((r) => r.stockStatus === "out-of-stock").length
  const totalRevenue = filteredReports.reduce((sum, r) => sum + r.totalRevenue, 0)
  const totalUnitsSold = filteredReports.reduce((sum, r) => sum + r.unitsSold, 0)
  const totalCost = filteredReports.reduce((sum, r) => {
    const product = products.find((p) => p.id === r.productId)
    return sum + r.unitsSold * (product?.costPrice || 0)
  }, 0)
  const totalProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Prepare chart data
  const stockStatusData = [
    { name: "In Stock", value: totalProducts - lowStockProducts - outOfStockProducts, color: "#10b981" },
    { name: "Low Stock", value: lowStockProducts, color: "#f59e0b" },
    { name: "Out of Stock", value: outOfStockProducts, color: "#ef4444" },
  ]

  const topSellingProducts = filteredReports.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10)
  const mostProfitableProducts = filteredReports
    .map((report) => {
      const product = products.find((p) => p.id === report.productId)
      const costPrice = product?.costPrice || 0
      const profit = report.totalRevenue - report.unitsSold * costPrice
      return { ...report, profit }
    })
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  const categoryData = categories.map((category) => {
    const categoryReports = filteredReports.filter((r) => r.category === category)
    const categoryRevenue = categoryReports.reduce((sum, r) => sum + r.totalRevenue, 0)
    const categoryCost = categoryReports.reduce((sum, r) => {
      const product = products.find((p) => p.id === r.productId)
      return sum + r.unitsSold * (product?.costPrice || 0)
    }, 0)
    return {
      name: category,
      revenue: categoryRevenue,
      cost: categoryCost,
      profit: categoryRevenue - categoryCost,
      units: categoryReports.reduce((sum, r) => sum + r.unitsSold, 0),
    }
  })

  const exportRestockingReport = () => {
    const csvContent = [
      [
        "Product Name",
        "Current Stock",
        "Recommended Order",
        "Days Until Stockout",
        "Priority",
        "Estimated Cost",
        "Potential Revenue",
        "Profit Margin %",
      ].join(","),
      ...restockingRecommendations.map((rec) =>
        [
          rec.productName,
          rec.currentStock,
          rec.recommendedOrder,
          rec.daysUntilStockout,
          rec.priority,
          rec.estimatedCost.toFixed(2),
          rec.potentialRevenue.toFixed(2),
          rec.profitMargin.toFixed(1),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `restocking-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md border border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              {stockAlerts.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {stockAlerts.length} Alert{stockAlerts.length !== 1 ? "s" : ""}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={exportRestockingReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" onClick={loadReportData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Filters */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger id="date-range">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="last90days">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tracking Type */}
              <div className="space-y-2">
                <Label htmlFor="tracking-tags">Product Tags</Label>
                <Select value={selectedTrackingCategory} onValueChange={setSelectedTrackingCategory}>
                  <SelectTrigger id="tracking-tags">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    <SelectItem value="alcohol">Alcohol</SelectItem>
                    <SelectItem value="tobacco">Tobacco</SelectItem>
                    <SelectItem value="high-value">High Value</SelectItem>
                    <SelectItem value="controlled">Controlled</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="health">Health & Beauty</SelectItem>
                    <SelectItem value="household">Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox id="profitable-only" checked={showProfitableOnly} onCheckedChange={setShowProfitableOnly} />
                <Label htmlFor="profitable-only" className="text-sm">
                  Show profitable products only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="alert-threshold" className="text-sm">
                  Alert threshold (days):
                </Label>
                <Input
                  id="alert-threshold"
                  type="number"
                  min="1"
                  max="30"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-20"
                />
              </div>
              <div className="text-sm text-slate-600">
                {selectedProducts.length > 0 && `${selectedProducts.length} products selected`}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-500">Loading comprehensive analytics...</span>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-5 mb-4 bg-slate-100 p-1 rounded-md">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Product Selection</TabsTrigger>
                <TabsTrigger value="restocking">Restocking</TabsTrigger>
                <TabsTrigger value="alerts">
                  Stock Alerts
                  {stockAlerts.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                      {stockAlerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {/* Enhanced Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-emerald-600">{totalProducts}</div>
                          <p className="text-sm text-slate-500">Total Products</p>
                        </div>
                        <Package className="h-8 w-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{totalUnitsSold}</div>
                          <p className="text-sm text-slate-500">Units Sold</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-emerald-600">${totalRevenue.toFixed(2)}</div>
                          <p className="text-sm text-slate-500">Total Revenue</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">${totalProfit.toFixed(2)}</div>
                          <p className="text-sm text-slate-500">Total Profit</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-amber-200 shadow-sm bg-amber-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-amber-600">{lowStockProducts}</div>
                          <p className="text-sm text-amber-700">Low Stock</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-red-200 shadow-sm bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
                          <p className="text-sm text-red-700">Out of Stock</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Profit Margin
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-600">{profitMargin.toFixed(1)}%</div>
                      <p className="text-sm text-slate-500 mt-2">Average profit margin across selected products</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Restocking Needed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {restockingRecommendations.filter((r) => r.priority === "high").length}
                      </div>
                      <p className="text-sm text-slate-500 mt-2">Products requiring immediate restocking</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Estimated Restock Cost
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        ${restockingRecommendations.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(2)}
                      </div>
                      <p className="text-sm text-slate-500 mt-2">Total cost for recommended restocking</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stockStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {stockStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Most Profitable Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={mostProfitableProducts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} interval={0} />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, "Profit"]} />
                            <Bar dataKey="profit" fill="#10b981" name="Profit ($)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="products">
                <div className="space-y-4">
                  {/* Product Selection Controls */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        id="select-all"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={handleSelectAllProducts}
                      />
                      <Label htmlFor="select-all" className="font-medium">
                        Select All ({filteredProducts.length} products)
                      </Label>
                    </div>
                    <div className="text-sm text-slate-600">
                      {selectedProducts.length} of {filteredProducts.length} products selected
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchTerm && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-sm">Search Results for "{searchTerm}"</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => {
                              const report = salesReports.find((r) => r.productId === product.id)
                              const isSelected = selectedProducts.includes(product.id)
                              const profitMargin =
                                product.price && product.costPrice
                                  ? ((product.price - product.costPrice) / product.price) * 100
                                  : 0

                              return (
                                <div
                                  key={product.id}
                                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${
                                    isSelected ? "bg-blue-50 border-blue-200" : "border-slate-200"
                                  }`}
                                  onClick={() => handleProductSelection(product.id, !isSelected)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) =>
                                        handleProductSelection(product.id, checked as boolean)
                                      }
                                    />
                                    <div>
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-sm text-slate-500">
                                        {product.category} • Stock: {product.stock || 0} • ${product.price.toFixed(2)}
                                        {product.tags &&
                                          product.tags.length > 0 &&
                                          ` • Tags: ${product.tags.join(", ")}`}
                                        {report && ` • Sold: ${report.unitsSold}`}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className="text-xs">
                                      {product.category}
                                    </Badge>
                                    {profitMargin > 0 && (
                                      <div className="text-xs text-slate-500 mt-1">
                                        {profitMargin.toFixed(1)}% margin
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-center py-4 text-slate-500">
                              No products found matching "{searchTerm}"
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Selected Products Summary */}
                  {selectedProducts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Selected Products ({selectedProducts.length})</span>
                          <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
                            Clear All
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedProducts.map((productId) => {
                            const product = products.find((p) => p.id === productId)
                            const report = salesReports.find((r) => r.productId === productId)
                            if (!product) return null

                            return (
                              <div
                                key={productId}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{product.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {product.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {report && (
                                    <span className="text-sm text-slate-600">
                                      {report.unitsSold} sold • ${report.totalRevenue.toFixed(2)}
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleProductSelection(productId, false)}
                                    className="h-6 w-6 p-0"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="restocking">
                <div className="space-y-6">
                  {/* Restocking Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                          {restockingRecommendations.filter((r) => r.priority === "high").length}
                        </div>
                        <p className="text-sm text-red-700">High Priority</p>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                          {restockingRecommendations.filter((r) => r.priority === "medium").length}
                        </div>
                        <p className="text-sm text-orange-700">Medium Priority</p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                          ${restockingRecommendations.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(2)}
                        </div>
                        <p className="text-sm text-blue-700">Total Cost</p>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                          $
                          {restockingRecommendations
                            .reduce((sum, r) => sum + (r.potentialRevenue - r.estimatedCost), 0)
                            .toFixed(2)}
                        </div>
                        <p className="text-sm text-green-700">Potential Profit</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Restocking Recommendations Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Restocking Recommendations
                        </CardTitle>
                        <Button onClick={() => setRestockingDialogOpen(true)} size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Generate Order
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3">Product</th>
                              <th className="text-left p-3">Current Stock</th>
                              <th className="text-left p-3">Recommended Order</th>
                              <th className="text-left p-3">Days Until Stockout</th>
                              <th className="text-left p-3">Priority</th>
                              <th className="text-left p-3">Est. Cost</th>
                              <th className="text-left p-3">Potential Revenue</th>
                              <th className="text-left p-3">Margin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {restockingRecommendations.map((rec) => (
                              <tr key={rec.productId} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-medium">{rec.productName}</td>
                                <td className="p-3">{rec.currentStock}</td>
                                <td className="p-3 font-semibold text-blue-600">{rec.recommendedOrder}</td>
                                <td className="p-3">
                                  <span
                                    className={`${
                                      rec.daysUntilStockout <= 3
                                        ? "text-red-600 font-semibold"
                                        : rec.daysUntilStockout <= 7
                                          ? "text-orange-600"
                                          : "text-green-600"
                                    }`}
                                  >
                                    {rec.daysUntilStockout === 999 ? "N/A" : `${rec.daysUntilStockout} days`}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <Badge
                                    variant={
                                      rec.priority === "high"
                                        ? "destructive"
                                        : rec.priority === "medium"
                                          ? "secondary"
                                          : "default"
                                    }
                                  >
                                    {rec.priority.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="p-3">${rec.estimatedCost.toFixed(2)}</td>
                                <td className="p-3">${rec.potentialRevenue.toFixed(2)}</td>
                                <td className="p-3">
                                  <span className={`${rec.profitMargin > 20 ? "text-green-600" : "text-orange-600"}`}>
                                    {rec.profitMargin.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alerts">
                <div className="space-y-4">
                  {stockAlerts.length > 0 ? (
                    stockAlerts.map((alert) => (
                      <Alert key={alert.id} className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-amber-800">
                              {alert.productName} is running low on stock
                            </div>
                            <div className="text-sm text-amber-700 mt-1">
                              Current stock: {alert.currentStock} | Minimum level: {alert.minStockLevel}
                              {alert.trackingCategory && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {alert.trackingCategory}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-amber-600 mt-1">
                              Alert created: {alert.createdAt.toLocaleString()}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          >
                            <BellOff className="h-4 w-4 mr-2" />
                            Acknowledge
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">All Stock Levels Optimal</h3>
                      <p className="text-slate-500">No active alerts. All products are adequately stocked.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue vs Cost by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" fill="#4f46e5" name="Revenue ($)" />
                            <Bar dataKey="cost" fill="#ef4444" name="Cost ($)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Profit by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, "Profit"]} />
                            <Legend />
                            <Bar dataKey="profit" fill="#10b981" name="Profit ($)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Stock Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Stock Alert Settings</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <div className="font-medium">{selectedProduct.name}</div>
                <div className="text-sm text-slate-500">Current stock: {selectedProduct.stock || 0}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-stock">Minimum Stock Level *</Label>
                <Input
                  id="min-stock"
                  type="number"
                  min="0"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                  placeholder="Enter minimum stock level"
                />
                <div className="text-xs text-slate-500">
                  Alert will be triggered when stock falls to or below this level
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking-cat">Product Tags</Label>
                <Select value={trackingCategory} onValueChange={setTrackingCategory}>
                  <SelectTrigger id="tracking-cat">
                    <SelectValue placeholder="Select product tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="alcohol">Alcohol</SelectItem>
                    <SelectItem value="tobacco">Tobacco</SelectItem>
                    <SelectItem value="high-value">High Value</SelectItem>
                    <SelectItem value="controlled">Controlled Substance</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="health">Health & Beauty</SelectItem>
                    <SelectItem value="household">Household</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-slate-500">Tag this product for specialized tracking and reporting</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStockSettings} className="bg-emerald-600 hover:bg-emerald-700">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restocking Order Dialog */}
      <Dialog open={restockingDialogOpen} onOpenChange={setRestockingDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Generate Restocking Order</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Recommended Qty</th>
                  <th className="text-left p-2">Unit Cost</th>
                  <th className="text-left p-2">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {restockingRecommendations.map((rec) => {
                  const product = products.find((p) => p.id === rec.productId)
                  const unitCost = product?.costPrice || 0
                  return (
                    <tr key={rec.productId} className="border-b">
                      <td className="p-2">{rec.productName}</td>
                      <td className="p-2 font-semibold">{rec.recommendedOrder}</td>
                      <td className="p-2">${unitCost.toFixed(2)}</td>
                      <td className="p-2">${(rec.recommendedOrder * unitCost).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">
                Total Order Cost: $
                {restockingRecommendations
                  .reduce((sum, r) => {
                    const product = products.find((p) => p.id === r.productId)
                    return sum + r.recommendedOrder * (product?.costPrice || 0)
                  }, 0)
                  .toFixed(2)}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setRestockingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={exportRestockingReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Order
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
