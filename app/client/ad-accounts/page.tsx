'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, LayoutGrid, ClipboardList } from 'lucide-react'
import { type AdAccount, type AdAccountRequest } from '@/types/database.types'
import { AdAccountList } from '@/components/ad-accounts/AdAccountList'
import { RequestHistoryList } from '@/components/ad-accounts/RequestHistoryList'
import { TopUpRequestModal } from '@/components/ad-accounts/TopUpRequestModal'
import { RequestAdAccountModal } from '@/components/ad-accounts/RequestAdAccountModal'
import { StatCard } from '@/components/shared/StatCard'
import { Wallet, CheckCircle, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

type Tab = 'accounts' | 'requests'

/** Map raw API row to typed AdAccount */
function mapAdAccount(raw: Record<string, unknown>): AdAccount {
  return {
    id: raw.id as string,
    name: raw.name as string,
    accountId: raw.account_id as string,
    platform: raw.platform as AdAccount['platform'],
    currency: raw.currency as string,
    timezone: raw.timezone as string,
    feePercentage: raw.fee_percentage as number,
    status: raw.status as AdAccount['status'],
    balance: (raw.balance_cents as number) / 100,
    balanceCents: raw.balance_cents as number,
    organizationId: raw.organization_id as string,
  }
}

/** Map raw API row to typed AdAccountRequest */
function mapRequest(raw: Record<string, unknown>): AdAccountRequest {
  return {
    id: raw.id as string,
    organizationId: raw.organization_id as string,
    accountName: raw.account_name as string,
    domainName: raw.domain_name as string,
    businessManagerId: raw.business_manager_id as string,
    currency: raw.currency as string,
    timezone: raw.timezone as string,
    platform: raw.platform as AdAccountRequest['platform'],
    status: raw.status as AdAccountRequest['status'],
    reviewedBy: raw.reviewed_by as string | null,
    reviewedAt: raw.reviewed_at as string | null,
    rejectionReason: raw.rejection_reason as string | null,
    createdAt: raw.created_at as string,
  }
}

/**
 * Client ad accounts page — shows accounts grid and request history in tabs.
 */
export default function ClientAdAccountsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('accounts')
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [requests, setRequests] = useState<AdAccountRequest[]>([])
  const [walletBalanceCents, setWalletBalanceCents] = useState(0)
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | undefined>()
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts((data as Record<string, unknown>[]).map(mapAdAccount))
      }
    } catch (err) {
      console.error('Failed to fetch ad accounts', err)
    } finally {
      setAccountsLoading(false)
    }
  }, [])

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-account-requests')
      if (res.ok) {
        const data = await res.json()
        setRequests((data as Record<string, unknown>[]).map(mapRequest))
      }
    } catch (err) {
      console.error('Failed to fetch requests', err)
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  const fetchWalletBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet')
      if (res.ok) {
        const data = await res.json()
        setWalletBalanceCents(data.balance_cents ?? 0)
      }
    } catch {
      // Non-critical; balance defaults to 0
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
    fetchWalletBalance()
  }, [fetchAccounts, fetchWalletBalance])

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests()
    }
  }, [activeTab, fetchRequests])

  const handleTopUp = (account: AdAccount) => {
    setSelectedAccount(account)
    setTopUpOpen(true)
  }

  const activeCount = accounts.filter((a) => a.status === 'active').length
  const totalBalanceCents = accounts.reduce((sum, a) => sum + a.balanceCents, 0)

  const TABS = [
    { key: 'accounts' as Tab, label: 'Accounts', icon: LayoutGrid },
    { key: 'requests' as Tab, label: 'Requests', icon: ClipboardList },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ad Accounts</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Manage your advertising accounts</p>
        </div>
        <button
          type="button"
          onClick={() => setRequestOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D7FF9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2D7FF9]/90"
        >
          <Plus className="h-4 w-4" />
          Request Ad Account
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#2A3040] bg-[#141920] p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-[#2D7FF9] text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#2A3040]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Stat cards */}
          {accountsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-[#141920] border border-[#2A3040]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                title="Active Accounts"
                value={activeCount}
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                title="Total Accounts"
                value={accounts.length}
                icon={BarChart3}
                color="blue"
              />
              <StatCard
                title="Total Balance"
                value={formatCurrency(totalBalanceCents)}
                icon={Wallet}
                color="purple"
              />
            </div>
          )}

          {/* Account list */}
          {accountsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-[#141920] border border-[#2A3040]" />
              ))}
            </div>
          ) : (
            <AdAccountList accounts={accounts} onTopUp={handleTopUp} />
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {requestsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-[#141920] border border-[#2A3040]" />
              ))}
            </div>
          ) : (
            <RequestHistoryList requests={requests} />
          )}
        </div>
      )}

      {/* Modals */}
      <TopUpRequestModal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        accounts={accounts}
        selectedAccount={selectedAccount}
        walletBalanceCents={walletBalanceCents}
        onSuccess={() => {
          fetchAccounts()
          fetchWalletBalance()
        }}
      />

      <RequestAdAccountModal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSuccess={fetchRequests}
      />
    </div>
  )
}
