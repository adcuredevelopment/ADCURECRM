import { type ReactNode } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'

/**
 * Agency panel layout - wraps all /agency/* pages
 */
export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout role="agency_admin">
      {children}
    </DashboardLayout>
  )
}
