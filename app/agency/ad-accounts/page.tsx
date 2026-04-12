'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Check, X, Copy, Megaphone, Clock, CheckCircle, XCircle, Filter } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { cn } from '@/lib/utils'

// =====================================================
// Types
// =====================================================

interface AdAccountRequest {
  id: string
  organization_id: string
  account_name: string
  domain_name: string
  business_manager_id: string
  currency: string
  timezone: string
  platform: 'meta' | 'google' | 'tiktok'
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  client_email: string
  client_name: string | null
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

// =====================================================
// Sub-components
// =====================================================

function PlatformBadge({ platform }: { platform: 'meta' | 'google' | 'tiktok' }) {
  const config = {
    meta: { label: 'Meta', classes: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    google: { label: 'Google', classes: 'text-green-400 bg-green-400/10 border-green-400/20' },
    tiktok: { label: 'TikTok', classes: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  }
  const { label, classes } = config[platform]
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', classes)}>
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const config = {
    pending: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    approved: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
    rejected: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20',
  }
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', config[status])}>
      {status}
    </span>
  )
}

// =====================================================
// Approve Modal
// =====================================================

interface ApproveModalProps {
  request: AdAccountRequest
  onConfirm: () => Promise<void>
  onClose: () => void
}

function ApproveModal({ request, onConfirm, onClose }: ApproveModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#10B981]/10">
            <CheckCircle className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Approve Account Request</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">This will create an ad account record</p>
          </div>
        </div>
        <div className="rounded-lg border border-[#2A3040] bg-[#141920] p-3 mb-5">
          <p className="text-sm font-medium text-white">{request.account_name}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{request.client_email}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-[#2A3040] bg-transparent px-4 py-2 text-sm text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-[#10B981] hover:bg-[#0ea172] px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Reject Modal
// =====================================================

interface RejectModalProps {
  request: AdAccountRequest
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}

function RejectModal({ request, onConfirm, onClose }: RejectModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    setLoading(true)
    await onConfirm(reason.trim())
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
            <h3 className="text-sm font-semibold text-white">Reject Account Request</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">{request.account_name}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Rejection Reason <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
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
              disabled={loading || !reason.trim()}
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
// Request Card
// =====================================================

interface RequestCardProps {
  request: AdAccountRequest
  onApprove: (req: AdAccountRequest) => void
  onReject: (req: AdAccountRequest) => void
}

function RequestCard({ request, onApprove, onReject }: RequestCardProps) {
  const [copied, setCopied] = useState(false)

  const copyForSheet = async () => {
    const text = [
      `Account Name: ${request.account_name}`,
      `Domain: ${request.domain_name}`,
      `Business Manager ID: ${request.business_manager_id}`,
      `Currency: ${request.currency}`,
      `Timezone: ${request.timezone}`,
      `Client Email: ${request.client_email}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="rounded-xl border border-[#2A3040] bg-[#141920] p-5 hover:border-[#3A4050] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white truncate">{request.account_name}</h3>
          <p className="text-xs text-[#4A5568] mt-0.5 truncate">{request.domain_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PlatformBadge platform={request.platform} />
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
        <DetailRow label="BM ID" value={request.business_manager_id} />
        <DetailRow label="Currency" value={request.currency} />
        <DetailRow label="Timezone" value={request.timezone} />
        <DetailRow label="Client" value={request.client_email} />
        <DetailRow
          label="Requested"
          value={new Date(request.created_at).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        />
      </div>

      {/* Rejection Reason */}
      {request.status === 'rejected' && request.rejection_reason && (
        <div className="rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/5 px-3 py-2 mb-4">
          <p className="text-xs text-[#EF4444] font-medium">Rejection Reason</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{request.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[#2A3040]">
        {request.status === 'pending' && (
          <>
            <button
              onClick={() => onApprove(request)}
              className="flex items-center gap-1.5 rounded-lg bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/20 px-3 py-1.5 text-xs font-medium text-[#10B981] transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={() => onReject(request)}
              className="flex items-center gap-1.5 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 px-3 py-1.5 text-xs font-medium text-[#EF4444] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </>
        )}
        <button
          onClick={copyForSheet}
          className="flex items-center gap-1.5 ml-auto rounded-lg border border-[#2A3040] bg-transparent hover:bg-[#2A3040] px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? 'Copied!' : 'Copy for Sheet'}
        </button>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#4A5568]">{label}</p>
      <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{value}</p>
    </div>
  )
}

// =====================================================
// Main Page
// =====================================================

export default function AdminAdAccountsPage() {
  const [requests, setRequests] = useState<AdAccountRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [approveTarget, setApproveTarget] = useState<AdAccountRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdAccountRequest | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/ad-account-requests')
      if (!res.ok) throw new Error('Failed to fetch')
      const data: AdAccountRequest[] = await res.json()
      setRequests(data)
    } catch {
      setError('Failed to load account requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      const res = await fetch(`/api/admin/ad-account-requests/${approveTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (!res.ok) throw new Error('Failed to approve')
      toast.success(`"${approveTarget.account_name}" approved successfully`)
      setApproveTarget(null)
      await fetchRequests()
    } catch {
      toast.error('Failed to approve request. Please try again.')
    }
  }

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return
    try {
      const res = await fetch(`/api/admin/ad-account-requests/${rejectTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejection_reason: reason }),
      })
      if (!res.ok) throw new Error('Failed to reject')
      toast.success(`"${rejectTarget.account_name}" rejected`)
      setRejectTarget(null)
      await fetchRequests()
    } catch {
      toast.error('Failed to reject request. Please try again.')
    }
  }

  // Compute stats
  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    total: requests.length,
  }

  // Apply filter
  const filtered = statusFilter === 'all'
    ? requests
    : requests.filter((r) => r.status === statusFilter)

  const filterTabs: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">Ad Account Requests</h2>
        <p className="text-[#94A3B8] text-sm mt-1">
          Review and manage client ad account requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="yellow" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
        <StatCard title="Total" value={stats.total} icon={Megaphone} color="blue" />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2A3040]">
        <Filter className="h-3.5 w-3.5 text-[#4A5568] mr-1" />
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              statusFilter === tab.value
                ? 'border-[#2D7FF9] text-[#2D7FF9]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            )}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 text-xs text-[#4A5568]">
                ({stats[tab.value]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 rounded-xl border border-[#2A3040] bg-[#141920]" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-48 gap-3">
          <p className="text-[#EF4444] text-sm">{error}</p>
          <button onClick={fetchRequests} className="text-xs text-[#2D7FF9] hover:underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-48 rounded-xl border border-dashed border-[#2A3040] bg-[#141920]/50">
          <Megaphone className="h-10 w-10 text-[#4A5568] mb-3" />
          <p className="text-sm font-medium text-white">
            {statusFilter === 'all' ? 'No account requests yet' : `No ${statusFilter} requests`}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            {statusFilter === 'all' ? 'Client requests will appear here' : 'Try a different filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          onConfirm={handleApprove}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
