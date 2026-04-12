'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { StatCard } from '@/components/shared/StatCard'
import { Wallet, Megaphone, Clock, ArrowRight, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { type AdAccount, type Transaction } from '@/types/database.types'

// =====================================================
// Helper: cents to euros
// =====================================================
function centsToEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

// =====================================================
// Platform badge
// =====================================================
function PlatformBadge({ platform }: { platform: 'meta' | 'google' | 'tiktok' }) {
  const config = {
    meta: { label: 'Meta', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    google: { label: 'Google', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    tiktok: { label: 'TikTok', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  }
  const { label, color } = config[platform]
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', color)}>
      {label}
    </span>
  )
}

// =====================================================
// Status badge
// =====================================================
function StatusBadge({ status }: { status: 'active' | 'disabled' }) {
  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded-full border font-medium',
        status === 'active'
          ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
          : 'text-[#94A3B8] bg-[#94A3B8]/10 border-[#94A3B8]/20'
      )}
    >
      {status === 'active' ? 'Active' : 'Disabled'}
    </span>
  )
}

// =====================================================
// Transaction status badge
// =====================================================
function TxStatusBadge({ status }: { status: 'pending' | 'completed' | 'rejected' }) {
  const config = {
    pending: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    completed: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
    rejected: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20',
  }
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', config[status])}>
      {status}
    </span>
  )
}

// =====================================================
// Dashboard data shape
// =====================================================
interface DashboardData {
  walletBalance: number  // cents
  adAccounts: AdAccount[]
  recentTransactions: Transaction[]
  pendingCount: number
}

// =====================================================
// Client Dashboard Page
// =====================================================
export default function ClientDashboardPage() {
  const { appUser } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!appUser) return

    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch wallet
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance_cents')
          .eq('organization_id', appUser.organizationId)
          .single()
        const wallet = walletData as { balance_cents: number } | null

        if (walletError && walletError.code !== 'PGRST116') {
          throw walletError
        }

        // Fetch ad accounts
        const { data: accounts, error: accountsError } = await supabase
          .from('ad_accounts')
          .select('*')
          .eq('organization_id', appUser.organizationId)
          .order('created_at', { ascending: false })

        if (accountsError) throw accountsError

        // Map ad accounts to app types (explicit cast for Supabase type narrowing)
        type AdAccountRow = {
          id: string; name: string; account_id: string; platform: 'meta' | 'google' | 'tiktok'
          currency: string; timezone: string; fee_percentage: number; status: 'active' | 'disabled'
          balance_cents: number; organization_id: string
        }
        const mappedAccounts: AdAccount[] = ((accounts ?? []) as AdAccountRow[]).map((a) => ({
          id: a.id,
          name: a.name,
          accountId: a.account_id,
          platform: a.platform,
          currency: a.currency,
          timezone: a.timezone,
          feePercentage: Number(a.fee_percentage),
          status: a.status,
          balance: a.balance_cents / 100,
          balanceCents: a.balance_cents,
          organizationId: a.organization_id,
        }))

        // Fetch recent transactions via wallet
        let transactions: Transaction[] = []
        if (wallet) {
          const { data: walletRecordData } = await supabase
            .from('wallets')
            .select('id')
            .eq('organization_id', appUser.organizationId)
            .single()

          const walletRecord = walletRecordData as { id: string } | null

          if (walletRecord) {
            const { data: txData } = await supabase
              .from('transactions')
              .select('*')
              .eq('wallet_id', walletRecord.id)
              .order('created_at', { ascending: false })
              .limit(5)

            type TxRow = {
              id: string; wallet_id: string; type: 'top_up' | 'transfer' | 'refund' | 'adjustment'
              amount_cents: number; status: 'pending' | 'completed' | 'rejected'
              reference: string | null; proof_url: string | null; notes: string | null
              ad_account_id: string | null; created_by: string | null
              reviewed_by: string | null; reviewed_at: string | null; created_at: string
            }
            transactions = ((txData ?? []) as TxRow[]).map((t) => ({
              id: t.id,
              walletId: t.wallet_id,
              type: t.type,
              amount: t.amount_cents / 100,
              amountCents: t.amount_cents,
              status: t.status,
              reference: t.reference,
              proofUrl: t.proof_url,
              notes: t.notes,
              adAccountId: t.ad_account_id,
              createdBy: t.created_by,
              reviewedBy: t.reviewed_by,
              reviewedAt: t.reviewed_at,
              createdAt: t.created_at,
            }))
          }
        }

        const pendingCount = transactions.filter((t) => t.status === 'pending').length

        setData({
          walletBalance: wallet?.balance_cents ?? 0,
          adAccounts: mappedAccounts,
          recentTransactions: transactions,
          pendingCount,
        })
      } catch (err) {
        console.error('[ClientDashboard] Error fetching data:', err)
        setError('Failed to load dashboard data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [appUser, supabase])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-[#EF4444] text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-[#2D7FF9] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const activeAccounts = data?.adAccounts.filter((a) => a.status === 'active').length ?? 0
  const previewAccounts = data?.adAccounts.slice(0, 3) ?? []

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Welcome back{appUser?.fullName ? `, ${appUser.fullName.split(' ')[0]}` : ''}
        </h2>
        <p className="text-[#94A3B8] text-sm mt-1">
          {appUser?.companyName ?? 'Your company'} · {new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Ad Accounts"
          value={activeAccounts}
          icon={Megaphone}
          color="blue"
          subtitle={`${data?.adAccounts.length ?? 0} total accounts`}
        />
        <StatCard
          title="Wallet Balance"
          value={centsToEuros(data?.walletBalance ?? 0)}
          icon={Wallet}
          color="green"
          subtitle="Available funds"
        />
        <StatCard
          title="Pending Transactions"
          value={data?.pendingCount ?? 0}
          icon={Clock}
          color={data?.pendingCount ? 'yellow' : 'blue'}
          subtitle="Awaiting approval"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/client/ad-accounts/request"
            className="flex items-center gap-2 rounded-lg bg-[#2D7FF9] hover:bg-[#1E6FE8] px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Request Ad Account
          </Link>
          <Link
            href="/client/wallet"
            className="flex items-center gap-2 rounded-lg bg-[#1A1F2B] hover:bg-[#2A3040] border border-[#2A3040] hover:border-[#3A4050] px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            <Wallet className="h-4 w-4" />
            Add Funds
          </Link>
        </div>
      </div>

      {/* Ad Accounts Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">
            Ad Accounts
          </h3>
          <Link
            href="/client/ad-accounts"
            className="flex items-center gap-1 text-xs text-[#2D7FF9] hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {previewAccounts.length === 0 ? (
          <EmptyAccountsState />
        ) : (
          <div className="space-y-3">
            {previewAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-xl border border-[#2A3040] bg-[#141920] p-4 hover:border-[#3A4050] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2A3040]">
                    <Megaphone className="h-4 w-4 text-[#94A3B8]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <p className="text-xs text-[#4A5568]">{account.accountId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-white">
                      {centsToEuros(account.balanceCents)}
                    </p>
                    <p className="text-xs text-[#4A5568]">Fee: {account.feePercentage}%</p>
                  </div>
                  <PlatformBadge platform={account.platform} />
                  <StatusBadge status={account.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wallet Widget */}
      <div className="rounded-xl border border-[#2A3040] bg-[#141920] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#2D7FF9]" />
            <h3 className="text-sm font-semibold text-white">Wallet</h3>
          </div>
          <Link
            href="/client/wallet"
            className="text-xs text-[#2D7FF9] hover:underline flex items-center gap-1"
          >
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-white">
              {centsToEuros(data?.walletBalance ?? 0)}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">Available balance</p>
          </div>
          <Link
            href="/client/wallet"
            className="flex items-center gap-2 rounded-lg bg-[#2D7FF9]/10 hover:bg-[#2D7FF9]/20 border border-[#2D7FF9]/20 px-3 py-2 text-sm font-medium text-[#2D7FF9] transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            Top up
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">
            Recent Activity
          </h3>
        </div>

        {data?.recentTransactions.length === 0 ? (
          <EmptyActivityState />
        ) : (
          <div className="rounded-xl border border-[#2A3040] bg-[#141920] divide-y divide-[#2A3040]">
            {data?.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-white capitalize">
                    {tx.type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-[#4A5568] mt-0.5">
                    {new Date(tx.createdAt).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TxStatusBadge status={tx.status} />
                  <span className="text-sm font-semibold text-white">
                    {centsToEuros(tx.amountCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// Empty States
// =====================================================

function EmptyAccountsState() {
  return (
    <div className="rounded-xl border border-dashed border-[#2A3040] bg-[#141920]/50 p-8 text-center">
      <Megaphone className="h-8 w-8 text-[#4A5568] mx-auto mb-3" />
      <p className="text-sm font-medium text-white mb-1">No ad accounts yet</p>
      <p className="text-xs text-[#94A3B8] mb-4">
        Request your first ad account to start advertising
      </p>
      <Link
        href="/client/ad-accounts/request"
        className="inline-flex items-center gap-2 rounded-lg bg-[#2D7FF9] hover:bg-[#1E6FE8] px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        <Plus className="h-4 w-4" />
        Request Ad Account
      </Link>
    </div>
  )
}

function EmptyActivityState() {
  return (
    <div className="rounded-xl border border-dashed border-[#2A3040] bg-[#141920]/50 p-8 text-center">
      <Clock className="h-8 w-8 text-[#4A5568] mx-auto mb-3" />
      <p className="text-sm font-medium text-white mb-1">No activity yet</p>
      <p className="text-xs text-[#94A3B8]">
        Your transaction history will appear here
      </p>
    </div>
  )
}

// =====================================================
// Loading Skeleton
// =====================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Heading skeleton */}
      <div>
        <div className="h-7 w-48 bg-[#1A1F2B] rounded mb-2" />
        <div className="h-4 w-72 bg-[#1A1F2B] rounded" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[#2A3040] bg-[#141920] p-5 h-28" />
        ))}
      </div>

      {/* Accounts skeleton */}
      <div>
        <div className="h-4 w-24 bg-[#1A1F2B] rounded mb-3" />
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-[#2A3040] bg-[#141920] p-4 h-16 mb-3" />
        ))}
      </div>
    </div>
  )
}
