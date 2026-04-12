'use client'

import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { type UserRole } from '@/types/database.types'

interface DashboardLayoutProps {
  children: ReactNode
  role: UserRole
  pageTitle?: string
}

/**
 * DashboardLayout wraps all authenticated pages.
 * Contains:
 * - Fixed sidebar (left, 240px on desktop)
 * - Sticky header (top)
 * - Scrollable main content area
 */
export function DashboardLayout({ children, role, pageTitle = 'Dashboard' }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0A0E14]">
      {/* Sidebar */}
      <Sidebar role={role} />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Header */}
        <Header title={pageTitle} role={role} />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
