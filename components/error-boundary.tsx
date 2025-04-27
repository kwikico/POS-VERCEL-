"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Something went wrong</h2>
            <p className="text-gray-600 text-center mb-6">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="text-sm bg-gray-100 p-3 rounded mb-4 overflow-auto max-h-32">
              <code>{this.state.error?.toString()}</code>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
