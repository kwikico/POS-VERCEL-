"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import type { Transaction } from "@/types/pos-types"
import { getDailyTransactionSummary } from "@/services/transaction-service"
import { Loader2 } from "lucide-react"

interface ReportsProps {
  transactions?: Transaction[]
}

export default function Reports({ transactions = [] }: ReportsProps) {
  const [reportType, setReportType] = useState("sales")
  const [dateRange, setDateRange] = useState("today")
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())
  const [isLoading, setIsLoading] = useState(false)
  const [dailySummaries, setDailySummaries] = useState<any[]>([])

  function getDefaultStartDate() {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split("T")[0]
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split("T")[0]
  }

  // Load daily summaries when date range changes
  useEffect(() => {
    async function loadDailySummaries() {
      setIsLoading(true)
      try {
        const summaries = []
        const start = dateRange === "custom" ? new Date(startDate) : getStartDateForRange(dateRange)
        const end = dateRange === "custom" ? new Date(endDate) : new Date()

        // Clone the start date to avoid modifying it
        const currentDate = new Date(start)

        // Loop through each day in the range
        while (currentDate <= end) {
          const summary = await getDailyTransactionSummary(currentDate)
          summaries.push({
            date: currentDate.toLocaleDateString(),
            sales: summary.totalSales,
            returns: summary.totalReturns,
            net: summary.totalSales - summary.totalReturns,
            count: summary.transactionCount,
          })

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1)
        }

        setDailySummaries(summaries)
      } catch (error) {
        console.error("Error loading daily summaries:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDailySummaries()
  }, [dateRange, startDate, endDate])

  function getStartDateForRange(range: string): Date {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (range) {
      case "today":
        return today
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return yesterday
      case "last7days":
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)
        return lastWeek
      case "last30days":
        const lastMonth = new Date(today)
        lastMonth.setDate(lastMonth.getDate() - 30)
        return lastMonth
      default:
        return today
    }
  }

  // Ensure transactions is always an array
  const safeTransactions = Array.isArray(transactions) ? transactions : []

  // Filter transactions based on date range
  const filteredTransactions = safeTransactions.filter((transaction) => {
    const txDate = new Date(transaction.timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeekStart = new Date(today)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastMonthStart = new Date(today)
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
    const customStart = new Date(startDate)
    const customEnd = new Date(endDate)
    customEnd.setHours(23, 59, 59, 999)

    switch (dateRange) {
      case "today":
        return txDate.toDateString() === today.toDateString()
      case "yesterday":
        return txDate.toDateString() === yesterday.toDateString()
      case "last7days":
        return txDate >= lastWeekStart
      case "last30days":
        return txDate >= lastMonthStart
      case "custom":
        return txDate >= customStart && txDate <= customEnd
      default:
        return true
    }
  })

  // Calculate totals
  const totalSales = filteredTransactions.filter((tx) => !tx.isReturn).reduce((sum, tx) => sum + tx.total, 0)

  const totalReturns = filteredTransactions.filter((tx) => tx.isReturn).reduce((sum, tx) => sum + Math.abs(tx.total), 0)

  const netSales = totalSales - totalReturns

  const cashTransactions = filteredTransactions
    .filter((tx) => tx.paymentMethod === "cash")
    .reduce((sum, tx) => sum + (tx.isReturn ? -tx.total : tx.total), 0)

  const cardTransactions = filteredTransactions
    .filter((tx) => tx.paymentMethod === "card")
    .reduce((sum, tx) => sum + (tx.isReturn ? -tx.total : tx.total), 0)

  // Prepare data for charts
  const paymentMethodData = [
    { name: "Cash", value: Math.abs(cashTransactions) },
    { name: "Card", value: Math.abs(cardTransactions) },
  ]

  const salesVsReturnsData = [
    { name: "Sales", value: totalSales },
    { name: "Returns", value: totalReturns },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md border border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50">
          <CardTitle>Sales Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="border-slate-300">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="returns">Returns</SelectItem>
                  <SelectItem value="payment">Payment Methods</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-500">Loading report data...</span>
            </div>
          ) : (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4 bg-slate-100 p-1 rounded-md">
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="charts"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  Charts
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  Transactions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-emerald-600">${totalSales.toFixed(2)}</div>
                      <p className="text-sm text-slate-500">Total Sales</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-emerald-600">${totalReturns.toFixed(2)}</div>
                      <p className="text-sm text-slate-500">Total Returns</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-emerald-600">${netSales.toFixed(2)}</div>
                      <p className="text-sm text-slate-500">Net Sales</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-emerald-600">{filteredTransactions.length}</div>
                      <p className="text-sm text-slate-500">Total Transactions</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-emerald-600">
                        ${Math.abs(cashTransactions).toFixed(2)}
                      </div>
                      <p className="text-sm text-slate-500">Cash Transactions</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-emerald-600">
                        ${Math.abs(cardTransactions).toFixed(2)}
                      </div>
                      <p className="text-sm text-slate-500">Card Transactions</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailySummaries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="sales" fill="#4f46e5" name="Sales" />
                            <Bar dataKey="returns" fill="#ef4444" name="Returns" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={paymentMethodData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {paymentMethodData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="transactions">
                <div className="border border-slate-200 rounded-md shadow-sm">
                  <div className="grid grid-cols-6 font-medium p-3 border-b bg-slate-100">
                    <div>ID</div>
                    <div>Date</div>
                    <div>Type</div>
                    <div>Payment</div>
                    <div>Items</div>
                    <div className="text-right">Total</div>
                  </div>
                  <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((tx) => (
                        <div key={tx.id} className="grid grid-cols-6 p-3 hover:bg-slate-50">
                          <div className="text-sm font-mono">{tx.id}</div>
                          <div className="text-sm">{new Date(tx.timestamp).toLocaleString()}</div>
                          <div className="text-sm">
                            {tx.isReturn ? (
                              <span className="text-amber-600 font-medium">Return</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Sale</span>
                            )}
                          </div>
                          <div className="text-sm capitalize">{tx.paymentMethod}</div>
                          <div className="text-sm">{tx.items ? tx.items.length : 0}</div>
                          <div className="text-sm text-right font-medium">${Math.abs(tx.total).toFixed(2)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        No transactions found for the selected period
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
