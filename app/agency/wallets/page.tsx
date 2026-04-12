'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Wallet, CheckCircle, XCircle, Eye } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { ProofViewerModal } from '@/components/admin/ProofViewerModal'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

// =====================================================
// Types
// =====================================================

interface WalletData {
  id: string
  organization_id: string
  balance_cents: number
  currency: string
  organization_name: string
  client_email: string
  client_name: string | null
  total_deposited_cents: number
  pending_cents: number
  created_at: string
}

interface PendingDeposit {
  id: string
  wallet_id: string
  amount_cents: number
  reference: string | null
  proof_url: string | null
  notes: string | null
  created_at: string
  client_email: string
  client_name: string | null
  organization_id: string
}

type ActiveTab = 'wallets' | 'pending'

// =====================================================
// Reject Deposit Modal
// =====================================================

interface RejectDepositModalProps {
  onConfirm: (notes: string) => Promise<void>
  onClose: () => void
  amount: number
  clientName: string
}

function RejectDepositModal({ onConfirm, onClose, amount, clientName }: RejectDepositModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) return
    setLoading(true)
    await onConfirm(notes.trim())
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#EF4444]/10">
            <XCircle className="h-5 w-5 text-[#EF4444]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Reject Deposit</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {formatCurrency(amount)} from {clientName}
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Reason for rejection <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Please provide a reason..."
              rows={3}
              required
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-[#2A3040] bg-transparent px-4 py-2 text-sm text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !notes.trim()}
              className="flex-1 rounded-lg bg-[#EF4444] hover:bg-[#dc2626] px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// Wallet Card
// =====================================================

function WalletCard({ wallet }: { wallet: WalletData }) {
  const isLow = wallet.balance_cents < 1000

  return (
    <div className={cn(
      'rounded-xl border bg-[#141920] p-5 transition-colors hover:border-[#3A4050]',
      isLow ? 'border-[#F59E0B]/30' : 'border-[#2A3040]'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-white">
            {wallet.client_name ?? wallet.organization_name}
          </p>
          <p className="text-xs text-[#4A5568] mt-0.5">{wallet.client_email}</p>
        </div>
        {isLow && (
          <span className="text-xs px-2 py-0.5 rounded-full border font-medium text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20">
            Low Balance
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">
          {formatCurrency(wallet.balance_cents, wallet.currency)}
        </p>
        <p className="text-xs text-[#4A5568]">Current balance</p>
      </div>
      {wallet.total_deposited_cents > 0 && (
        <div className="mt-3 pt-3 border-t border-[#2A3040]">
          <p className="text-xs text-[#94A3B8]">
            Total deposited:{' '}
            <span className="text-white font-medium">
              {formatCurrency(wallet.total_deposited_cents)}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

// =====================================================
// Pending Deposit Row
// =====================================================

interface DepositRowProps {
  deposit: PendingDeposit
  onApprove: (deposit: PendingDeposit) => Promise<void>
  onReject: (deposit: PendingDeposit) => void
  onViewProof: (deposit: PendingDeposit) => void
}

function DepositRow({ deposit, onApprove, onReject, onViewProof }: DepositRowProps) {
  const [approving, setApproving] = useState(false)

  const handleApprove = async () => {
    setApproving(true)
    await onApprove(deposit)
    setApproving(false)
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[#2A3040] last:border-0">
      {/* Client info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">
          {deposit.client_name ?? deposit.client_email}
        </p>
        <p className="text-xs text-[#4A5568] mt-0.5">{deposit.client_email}</p>
        {deposit.reference && (
          <p className="text-xs text-[#94A3B8] mt-0.5 font-mono">
            Ref: {deposit.reference}
          </p>
        )}
      </div>

      {/* Amount & Date */}
      <div className="text-right flex-shrink-0">
        <p className="text-base font-bold text-white">{formatCurrency(deposit.amount_cents)}</p>
        <p className="text-xs text-[#4A5568] mt-0.5">
          {new Date(deposit.created_at).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {deposit.proof_url && (
          <button
            onClick={() => onViewProof(deposit)}
            className="flex items-center gap-1.5 rounded-lg border border-[#2A3040] bg-transparent hover:bg-[#2A3040] px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Proof
          </button>
        )}
        <button
          onClick={handleApprove}
          disabled={approving}
          className="flex items-center gap-1.5 rounded-lg bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/20 px-3 py-1.5 text-xs font-medium text-[#10B981] transition-colors disabled:opacity-50"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {approving ? 'Approving...' : 'Approve'}
        </button>
        <button
          onClick={() => onReject(deposit)}
          className="flex items-center gap-1.5 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 px-3 py-1.5 text-xs font-medium text-[#EF4444] transition-colors"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>
    </div>
  )
}

// =====================================================
// Main Page
// =====================================================

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [deposits, setDeposits] = useState<PendingDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('wallets')
  const [rejectTarget, setRejectTarget] = useState<PendingDeposit | null>(null)
  const [proofTarget, setProofTarget] = useState<PendingDeposit | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [walletsRes, depositsRes] = await Promise.all([
        fetch('/api/admin/wallets'),
        fetch('/api/admin/transactions'),
      ])

      if (walletsRes.ok) {
        const data: WalletData[] = await walletsRes.json()
        setWallets(data)
      }

      if (depositsRes.ok) {
        const data: PendingDeposit[] = await depositsRes.json()
        setDeposits(data)
      }
    } catch {
      setError('Failed to load wallet data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApproveDeposit = async (deposit: PendingDeposit) => {
    try {
      const res = await fetch(`/api/admin/transactions/${deposit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (!res.ok) throw new Error('Failed to approve')
      toast.success(`Deposit of ${formatCurrency(deposit.amount_cents)} approved`)
      await fetchData()
    } catch {
      toast.error('Failed to approve deposit. Please try again.')
    }
  }

  const handleRejectDeposit = async (notes: string) => {
    if (!rejectTarget) return
    try {
      const res = await fetch(`/api/admin/transactions/${rejectTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', notes }),
      })
      if (!res.ok) throw new Error('Failed to reject')
      toast.success('Deposit rejected')
      setRejectTarget(null)
      await fetchData()
    } catch {
      toast.error('Failed to reject deposit. Please try again.')
    }
  }

  // Compute wallet stats
  const totalBalance = wallets.reduce((s, w) => s + w.balance_cents, 0)
  const totalDeposited = wallets.reduce((s, w) => s + w.total_deposited_cents, 0)
  const totalPending = wallets.reduce((s, w) => s + w.pending_cents, 0)
  const activeWallets = wallets.filter((w) => w.balance_cents > 0).length

  const tabs: { value: ActiveTab; label: string; count?: number }[] = [
    { value: 'wallets', label: 'All Wallets' },
    { value: 'pending', label: 'Pending Deposits', count: deposits.length },
  ]

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">Wallet Management</h2>
        <p className="text-[#94A3B8] text-sm mt-1">
          Manage client wallets and verify deposit proofs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2A3040]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.value
                ? 'border-[#2D7FF9] text-[#2D7FF9]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 rounded-full bg-[#EF4444] px-1.5 py-0.5 text-xs font-medium text-white">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-xl border border-[#2A3040] bg-[#141920]" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-48 gap-3">
          <p className="text-[#EF4444] text-sm">{error}</p>
          <button onClick={fetchData} className="text-xs text-[#2D7FF9] hover:underline">
            Retry
          </button>
        </div>
      ) : activeTab === 'wallets' ? (
        <>
          {/* Wallet Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Total Balance"
              value={formatCurrency(totalBalance)}
              icon={Wallet}
              color="blue"
            />
            <StatCard
              title="Total Deposited"
              value={formatCurrency(totalDeposited)}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Pending"
              value={formatCurrency(totalPending)}
              icon={XCircle}
              color="yellow"
            />
            <StatCard
              title="Active Wallets"
              value={activeWallets}
              icon={Wallet}
              color="blue"
            />
          </div>

          {/* Wallet Cards */}
          {wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-48 rounded-xl border border-dashed border-[#2A3040] bg-[#141920]/50">
              <Wallet className="h-10 w-10 text-[#4A5568] mb-3" />
              <p className="text-sm font-medium text-white">No wallets found</p>
              <p className="text-xs text-[#94A3B8] mt-1">Client wallets will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wallets.map((wallet) => (
                <WalletCard key={wallet.id} wallet={wallet} />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Pending Deposits Tab */
        <div className="rounded-xl border border-[#2A3040] bg-[#141920]">
          {deposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-48 p-6">
              <CheckCircle className="h-10 w-10 text-[#10B981] mb-3" />
              <p className="text-sm font-medium text-white">No pending deposits</p>
              <p className="text-xs text-[#94A3B8] mt-1">All deposits have been verified</p>
            </div>
          ) : (
            <div className="p-5">
              <p className="text-xs text-[#94A3B8] mb-4">
                {deposits.length} deposit{deposits.length > 1 ? 's' : ''} awaiting verification
              </p>
              {deposits.map((deposit) => (
                <DepositRow
                  key={deposit.id}
                  deposit={deposit}
                  onApprove={handleApproveDeposit}
                  onReject={setRejectTarget}
                  onViewProof={setProofTarget}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectDepositModal
          amount={rejectTarget.amount_cents}
          clientName={rejectTarget.client_name ?? rejectTarget.client_email}
          onConfirm={handleRejectDeposit}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {/* Proof Viewer Modal */}
      {proofTarget && (
        <ProofViewerModal
          isOpen={true}
          onClose={() => setProofTarget(null)}
          proofUrl={proofTarget.proof_url!}
          title={`Deposit proof — ${proofTarget.client_name ?? proofTarget.client_email} — ${formatCurrency(proofTarget.amount_cents)}`}
        />
      )}
    </div>
  )
}
