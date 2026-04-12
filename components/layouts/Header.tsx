'use client'

import { Bell } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { type UserRole } from '@/types/database.types'

interface HeaderProps {
  title: string
  role: UserRole
}

export function Header({ title, role }: HeaderProps) {
  const { appUser } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#2A3040] bg-[#0A0E14]/95 backdrop-blur-sm px-6 lg:px-8">
      {/* Page title */}
      <h1 className="text-base font-semibold text-white lg:text-lg">{title}</h1>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell (agency only) */}
        {role === 'agency_admin' && (
          <button className="relative p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2A3040] transition-colors">
            <Bell className="h-5 w-5" />
            {/* Notification dot - will be dynamic in Phase 3 */}
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#2D7FF9]" />
          </button>
        )}

        {/* User avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A3040] border border-[#3A4050] cursor-pointer hover:border-[#2D7FF9] transition-colors">
          <span className="text-white text-xs font-semibold">
            {appUser?.fullName?.charAt(0)?.toUpperCase() ??
              appUser?.email?.charAt(0)?.toUpperCase() ??
              'U'}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Header
