'use client'

import { useEffect, useState } from 'react'
import { Users, Wallet, Megaphone, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/shared/StatCard'
import { AlertsBanner } from '@/components/admin/AlertsBanner'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { PendingActionsWidget } from '@/components/admin/PendingActionsWidget'
import { formatCurrency } from '@/lib/utils/currency'

// =====================================================
// Types
// =====================================================

interface AdminStats {
  totalClients: number
  totalAdBalance: number
  totalWalletBalance: number
  pendingRequests: number
  pendingDeposits: number
}

interface RecentTransaction {
  id: string
  type: string
  amount_cents: number
  status: string
  client_email: string
  client_name: string | null
  created_at: string
}

// =====================================================
// Admin Dashboard Page
// =====================================================

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentTxs, setRecentTxs] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsRes, txRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/transactions?limit=5'),
      ])

      if (!statsRes.ok) throw new Error('Failed to fetch stats')

      const statsData: AdminStats = await statsRes.json()
      setStats(statsData)

      if (txRes.ok) {
        const txData: RecentTransaction[] = await txRes.json()
        setRecentTxs(txData.slice(0, 5))
      }
    } catch (err) {
      console.error('[AdminDashboard] Error:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <p className="text-[#EF4444] text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="text-xs text-[#2D7FF9] hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const totalPending = (stats?.pendingRequests ?? 0) + (stats?.pendingDeposits ?? 0)

  return (
    <div className="space-y-6">
      {/* Alerts Banner */}
      <AlertsBanner />

      {/* Page Heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-[#94A3B8] text-sm mt-1">
          Overview of all clients, wallets, and pending actions
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats?.totalClients ?? 0}
          icon={Users}
          color="blue"
          subtitle="Active organizations"
        />
        <StatCard
          title="Total Ad Balance"
          value={formatCurrency(stats?.totalAdBalance ?? 0)}
          icon={Megaphone}
          color="green"
          subtitle="Across all ad accounts"
        />
        <StatCard
          title="Total Wallet Balance"
          value={formatCurrency(stats?.totalWalletBalance ?? 0)}
          icon={Wallet}
          color="yellow"
          subtitle="Sum of all client wallets"
        />
        <StatCard
          title="Pending Actions"
          value={totalPending}
          icon={Clock}
          color={totalPending > 0 ? 'red' : 'blue'}
          subtitle="Requests + deposits"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Two-Column Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Actions Widget */}
        <PendingActionsWidget
          pendingRequests={stats?.pendingRequests ?? 0}
          pendingDeposits={stats?.pendingDeposits ?? 0}
        />

        {/* Recent Activity */}
        <div className="rounded-xl border border-[#2A3040] bg-[#141920] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Deposits</h3>
            <Link
              href="/agency/wallets"
              className="flex items-center gap-1 text-xs text-[#2D7FF9] hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentTxs.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[#94A3B8]">No pending deposits</p>
              <p className="text-xs text-[#4A5568] mt-1">All transactions verified</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2A3040]">
              {recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {tx.client_name ?? tx.client_email}
                    </p>
                    <p className="text-xs text-[#4A5568] mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(tx.amount_cents)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Loading Skeleton
// =====================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-[#1A1F2B] rounded-xl" />
      <div>
        <div className="h-7 w-48 bg-[#1A1F2B] rounded mb-2" />
        <div className="h-4 w-72 bg-[#1A1F2B] rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-[#2A3040] bg-[#141920]" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-[#2A3040] bg-[#141920]" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-xl border border-[#2A3040] bg-[#141920]" />
        ))}
      </div>
    </div>
  )
}
