'use client'

import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  children: React.ReactNode
}

/**
 * Client-side wrapper for ErrorBoundary.
 * Needed because ErrorBoundary is a class component and must be used
 * in a 'use client' context when imported from server components.
 */
export function ErrorBoundaryWrapper({ children }: Props) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
