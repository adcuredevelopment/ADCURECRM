'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { WalletStats } from '@/components/wallet/WalletStats'
import { TransactionFilters, type TransactionFilterState } from '@/components/wallet/TransactionFilters'
import { TransactionList } from '@/components/wallet/TransactionList'
import { AddFundsModal } from '@/components/wallet/AddFundsModal'
import { type Transaction } from '@/types/database.types'

interface WalletData {
  balance_cents: number
  pending_cents: number
  deposited_cents: number
  spent_cents: number
}

const DEFAULT_FILTERS: TransactionFilterState = {
  type: 'all',
  status: 'all',
  sort: 'newest',
  from: '',
  to: '',
}

/** Map raw API transaction rows to our typed Transaction model */
function mapTransaction(raw: Record<string, unknown>): Transaction {
  return {
    id: raw.id as string,
    walletId: raw.wallet_id as string,
    type: raw.type as Transaction['type'],
    amount: (raw.amount_cents as number) / 100,
    amountCents: raw.amount_cents as number,
    status: raw.status as Transaction['status'],
    reference: raw.reference as string | null,
    proofUrl: raw.proof_url as string | null,
    notes: raw.notes as string | null,
    adAccountId: raw.ad_account_id as string | null,
    createdBy: raw.created_by as string | null,
    reviewedBy: raw.reviewed_by as string | null,
    reviewedAt: raw.reviewed_at as string | null,
    createdAt: raw.created_at as string,
  }
}

/**
 * Client wallet page — shows balance stats, transaction filters, and transaction list.
 */
export default function ClientWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_FILTERS)
  const [walletLoading, setWalletLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet')
      if (res.ok) {
        const data = await res.json()
        setWallet(data)
      }
    } catch (err) {
      console.error('Failed to fetch wallet', err)
    } finally {
      setWalletLoading(false)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.sort) params.set('sort', filters.sort)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)

      const res = await fetch(`/api/wallet/transactions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions((data as Record<string, unknown>[]).map(mapTransaction))
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err)
    } finally {
      setTxLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleDepositSuccess = () => {
    // Refresh wallet stats and transactions after a deposit is submitted
    fetchWallet()
    fetchTransactions()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Manage your balance and transactions</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D7FF9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2D7FF9]/90"
        >
          <Plus className="h-4 w-4" />
          Add Funds
        </button>
      </div>

      {/* Stats */}
      {walletLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[#141920] border border-[#2A3040]" />
          ))}
        </div>
      ) : (
        <WalletStats
          balance={wallet?.balance_cents ?? 0}
          pending={wallet?.pending_cents ?? 0}
          deposited={wallet?.deposited_cents ?? 0}
          spent={wallet?.spent_cents ?? 0}
        />
      )}

      {/* Filters */}
      <TransactionFilters filters={filters} onChange={setFilters} />

      {/* Transactions */}
      {txLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[#141920] border border-[#2A3040]" />
          ))}
        </div>
      ) : (
        <TransactionList transactions={transactions} />
      )}

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleDepositSuccess}
      />
    </div>
  )
}
