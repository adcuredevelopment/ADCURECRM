'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Wallet,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useState } from 'react'
import { type UserRole } from '@/types/database.types'

// =====================================================
// Navigation link definitions
// =====================================================

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const clientLinks: NavLink[] = [
  { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/ad-accounts', label: 'Ad Accounts', icon: Megaphone },
  { href: '/client/wallet', label: 'Wallet', icon: Wallet },
  { href: '/client/invoices', label: 'Invoices', icon: FileText },
]

const agencyLinks: NavLink[] = [
  { href: '/agency/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agency/account-applications', label: 'Applications', icon: ClipboardList },
  { href: '/agency/ad-accounts', label: 'Ad Accounts', icon: Megaphone },
  { href: '/agency/wallets', label: 'Wallets', icon: Wallet },
  { href: '/agency/support', label: 'Support', icon: MessageSquare },
  { href: '/agency/management/users', label: 'Users', icon: Users },
]

// =====================================================
// Sidebar Component
// =====================================================

interface SidebarProps {
  role: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { appUser, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = role === 'agency_admin' ? agencyLinks : clientLinks

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2A3040]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2D7FF9] flex-shrink-0">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">AdCure</p>
          <p className="text-[#94A3B8] text-xs leading-tight">
            {role === 'agency_admin' ? 'Agency Panel' : 'Client Portal'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[#2D7FF9]/15 text-[#2D7FF9] border border-[#2D7FF9]/20'
                  : 'text-[#94A3B8] hover:bg-[#2A3040] hover:text-white border border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  active ? 'text-[#2D7FF9]' : 'text-[#4A5568] group-hover:text-white'
                )}
              />
              {link.label}
              {active && (
                <ChevronRight className="ml-auto h-3 w-3 text-[#2D7FF9]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="border-t border-[#2A3040] p-3 space-y-2">
        {/* User info */}
        {appUser && (
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A3040] flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {(appUser.fullName ?? appUser.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {appUser.fullName ?? 'User'}
              </p>
              <p className="text-xs text-[#4A5568] truncate">{appUser.email}</p>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#94A3B8] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors border border-transparent"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-[#1A1F2B] border-r border-[#2A3040] fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#1A1F2B] border border-[#2A3040] text-white"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile: Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: Slide-in sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 z-50 h-screen w-72 bg-[#1A1F2B] border-r border-[#2A3040] transform transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2A3040] transition-colors"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>
    </>
  )
}

export default Sidebar
