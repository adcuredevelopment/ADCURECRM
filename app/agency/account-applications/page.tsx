'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Loader2,
  X,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

// =====================================================
// Types
// =====================================================

interface Application {
  id: string
  company_name: string
  kvk_number: string
  vat_number: string
  iban: string | null
  full_name: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_at: string | null
  created_at: string
}

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all'

// =====================================================
// Reject Modal
// =====================================================

function RejectModal({
  application,
  onClose,
  onConfirm,
}: {
  application: Application
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!reason.trim()) return
    setLoading(true)
    await onConfirm(reason.trim())
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2A3040] bg-[#1A1F2B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A3040] px-6 py-4">
          <h2 className="text-base font-semibold text-white">Aanvraag afwijzen</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-[#EF4444] mt-0.5 shrink-0" />
            <p className="text-sm text-[#94A3B8]">
              Je staat op het punt de aanvraag van{' '}
              <strong className="text-white">{application.company_name}</strong> af te wijzen.
              De aanvrager ontvangt een email met de reden.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Afwijzingsreden <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Geef een duidelijke reden voor de afwijzing..."
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:border-[#EF4444] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/20 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#2A3040] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#2A3040] py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#EF4444] py-2.5 text-sm font-medium text-white hover:bg-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Afwijzen
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Application Card
// =====================================================

function ApplicationCard({
  application,
  onApprove,
  onReject,
}: {
  application: Application
  onApprove: (app: Application) => void
  onReject: (app: Application) => void
}) {
  const timeAgo = formatDistanceToNow(new Date(application.created_at), {
    addSuffix: true,
    locale: nl,
  })

  const statusConfig = {
    pending: { label: 'In behandeling', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10 border-[#F59E0B]/20', icon: Clock },
    approved: { label: 'Goedgekeurd', color: 'text-[#10B981]', bg: 'bg-[#10B981]/10 border-[#10B981]/20', icon: CheckCircle },
    rejected: { label: 'Afgewezen', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10 border-[#EF4444]/20', icon: XCircle },
  }[application.status]

  const StatusIcon = statusConfig.icon

  return (
    <div className="rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-5 space-y-4 hover:border-[#3A4050] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2D7FF9]/10 border border-[#2D7FF9]/20">
            <span className="text-sm font-bold text-[#2D7FF9]">
              {application.company_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{application.company_name}</p>
            <p className="text-xs text-[#4A5568]">{application.full_name}</p>
          </div>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </span>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 gap-1.5">
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Mail className="h-3 w-3 text-[#4A5568] shrink-0" />
          {application.email}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Phone className="h-3 w-3 text-[#4A5568] shrink-0" />
          {application.phone}
        </div>
      </div>

      {/* Company details */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'KVK', value: application.kvk_number },
          { label: 'BTW', value: application.vat_number },
          ...(application.iban ? [{ label: 'IBAN', value: application.iban }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-[#141920] px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#4A5568]">{label}</p>
            <p className="mt-0.5 text-xs font-mono text-[#94A3B8]">{value}</p>
          </div>
        ))}
      </div>

      {/* Rejection reason */}
      {application.status === 'rejected' && application.rejection_reason && (
        <div className="rounded-lg border-l-2 border-[#EF4444] bg-[#EF4444]/5 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#EF4444] mb-1">Reden</p>
          <p className="text-xs text-[#94A3B8]">{application.rejection_reason}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-[#4A5568]">
          <Calendar className="h-3 w-3" />
          {timeAgo}
        </div>

        {application.status === 'pending' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onReject(application)}
              className="flex items-center gap-1.5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-1.5 text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Afwijzen
            </button>
            <button
              type="button"
              onClick={() => onApprove(application)}
              className="flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#059669] transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Goedkeuren
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// Approve Confirm Modal
// =====================================================

function ApproveModal({
  application,
  onClose,
  onConfirm,
}: {
  application: Application
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2A3040] bg-[#1A1F2B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A3040] px-6 py-4">
          <h2 className="text-base font-semibold text-white">Aanvraag goedkeuren</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-[#94A3B8]">
            Dit maakt automatisch aan voor{' '}
            <strong className="text-white">{application.company_name}</strong>:
          </p>
          <ul className="space-y-2">
            {[
              'Organisatie account',
              'Login account (wachtwoord reset email wordt verstuurd)',
              'Wallet met €0 saldo',
              'Welkomstmail naar aanvrager',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <CheckCircle className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 border-t border-[#2A3040] px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#2A3040] py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors">
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#10B981] py-2.5 text-sm font-medium text-white hover:bg-[#059669] transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Goedkeuren
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Main Page
// =====================================================

export default function AccountApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('pending')
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null)
  const [approveTarget, setApproveTarget] = useState<Application | null>(null)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/account-applications?status=${activeTab}`)
      const data = await res.json()
      setApplications(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Kon aanvragen niet laden')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // Stats (always fetch all for counts)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })

  useEffect(() => {
    fetch('/api/admin/account-applications?status=all')
      .then((r) => r.json())
      .then((data: Application[]) => {
        if (!Array.isArray(data)) return
        setStats({
          total: data.length,
          pending: data.filter((a) => a.status === 'pending').length,
          approved: data.filter((a) => a.status === 'approved').length,
          rejected: data.filter((a) => a.status === 'rejected').length,
        })
      })
      .catch(() => {})
  }, [applications])

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      const res = await fetch(`/api/admin/account-applications/${approveTarget.id}/approve`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${approveTarget.company_name} is goedgekeurd!`)
      setApproveTarget(null)
      fetchApplications()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Goedkeuren mislukt')
    }
  }

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return
    try {
      const res = await fetch(`/api/admin/account-applications/${rejectTarget.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Aanvraag van ${rejectTarget.company_name} afgewezen`)
      setRejectTarget(null)
      fetchApplications()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Afwijzen mislukt')
    }
  }

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'pending', label: 'In behandeling', count: stats.pending },
    { key: 'approved', label: 'Goedgekeurd', count: stats.approved },
    { key: 'rejected', label: 'Afgewezen', count: stats.rejected },
    { key: 'all', label: 'Alle', count: stats.total },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Account Aanvragen</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Bekijk en beoordeel binnenkomende aanvragen</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'In behandeling', value: stats.pending, color: '#F59E0B', icon: Clock },
          { label: 'Goedgekeurd', value: stats.approved, color: '#10B981', icon: CheckCircle },
          { label: 'Afgewezen', value: stats.rejected, color: '#EF4444', icon: XCircle },
          { label: 'Totaal', value: stats.total, color: '#2D7FF9', icon: Users },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color }} />
              <span className="text-xs text-[#94A3B8]">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-[#2A3040] bg-[#141920] p-1 w-fit">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-[#2D7FF9] text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#2A3040]'
            }`}
          >
            {label}
            {count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === key ? 'bg-white/20' : 'bg-[#2A3040]'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#2D7FF9]" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-10 w-10 text-[#2A3040] mb-3" />
          <p className="text-sm font-medium text-[#94A3B8]">Geen aanvragen gevonden</p>
          <p className="text-xs text-[#4A5568] mt-1">
            {activeTab === 'pending' ? 'Er zijn geen openstaande aanvragen' : 'Geen aanvragen in deze categorie'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          application={approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
        />
      )}
      {rejectTarget && (
        <RejectModal
          application={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  )
}
