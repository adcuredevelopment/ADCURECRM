import { type ReactNode } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'

/**
 * Client portal layout - wraps all /client/* pages
 */
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout role="client">
      {children}
    </DashboardLayout>
  )
}
