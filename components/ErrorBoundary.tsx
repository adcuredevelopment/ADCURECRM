import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary — catches unhandled render errors and shows a
 * graceful fallback UI instead of crashing the entire application.
 * Must be a class component per the React Error Boundary API.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging without exposing them to the user
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0E14] px-4">
          <div className="w-full max-w-md rounded-xl bg-[#1A1F2B] border border-[#2A3040] p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10">
              <AlertTriangle className="h-7 w-7 text-[#EF4444]" />
            </div>

            <h2 className="mb-2 text-xl font-bold text-white">
              Something went wrong
            </h2>
            <p className="mb-6 text-sm text-[#94A3B8] leading-relaxed">
              An unexpected error occurred. Please try again or contact support if
              the problem persists.
            </p>

            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center rounded-lg bg-[#2D7FF9] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2D7FF9]/90"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
