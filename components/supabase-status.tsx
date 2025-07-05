"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { testSupabaseConnection, testSupabaseTables } from "@/lib/supabase"

interface ConnectionStatus {
  success: boolean
  error?: string
  message?: string
  details?: any
}

interface TableStatus {
  exists: boolean
  error: string | null
}

interface TablesStatus {
  products: TableStatus
  transactions: TableStatus
  transaction_items: TableStatus
  error?: string
}

export function SupabaseStatus() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [tablesStatus, setTablesStatus] = useState<TablesStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)

    try {
      // Test basic connection
      const connResult = await testSupabaseConnection()
      setConnectionStatus(connResult)

      // Test tables
      const tablesResult = await testSupabaseTables()
      setTablesStatus(tablesResult)
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className={success ? "bg-green-100 text-green-800" : ""}>
        {success ? "Connected" : "Failed"}
      </Badge>
    )
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Database Connection</CardTitle>
          <Button variant="outline" size="sm" onClick={runTests} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {connectionStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(connectionStatus.success)}
                  <span className="font-medium">Supabase Connection</span>
                </div>
                {getStatusBadge(connectionStatus.success)}
              </div>

              {connectionStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Connection Error</p>
                      <p className="text-sm text-red-700">{connectionStatus.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {connectionStatus.success && connectionStatus.message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{connectionStatus.message}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Testing connection...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tables Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Database Tables</CardTitle>
        </CardHeader>
        <CardContent>
          {tablesStatus ? (
            <div className="space-y-3">
              {tablesStatus.error ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{tablesStatus.error}</p>
                </div>
              ) : (
                <>
                  {Object.entries(tablesStatus).map(([tableName, status]) => {
                    if (tableName === "error") return null

                    return (
                      <div key={tableName} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status.exists)}
                          <span className="font-medium">{tableName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(status.exists)}
                          {status.error && <span className="text-xs text-red-600">{status.error}</span>}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Checking tables...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL</span>
              {getStatusBadge(!!process.env.NEXT_PUBLIC_SUPABASE_URL)}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              {getStatusBadge(!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
