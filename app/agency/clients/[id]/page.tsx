'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Loader2, X, AlertTriangle, CheckCircle,
  Mail, Phone, Building2, Calendar, Wallet,
  Megaphone, CreditCard, Edit, Trash2, UserX, UserCheck,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

// =====================================================
// Types
// =====================================================

interface ClientData {
  user: {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    company_name: string | null
    role: string
    organization_id: string
    created_at: string
    organizations: { id: string; name: string; type: string } | null
  }
  wallet: {
    id: string
    balance_cents: number
    currency: string
  } | null
  adAccounts: {
    id: string
    name: string
    platform: string
    status: string
    fee_percentage: number
    balance_cents: number
  }[]
  stats: {
    activeAdAccounts: number
    totalAdAccounts: number
    walletBalance: number
    totalTopUps: number
    totalSpent: number
  }
}

// =====================================================
// Edit Modal
// =====================================================

function EditClientModal({
  client,
  onClose,
  onSave,
}: {
  client: ClientData['user']
  onClose: () => void
  onSave: (data: { full_name: string; phone: string; email: string }) => Promise<void>
}) {
  const [fullName, setFullName] = useState(client.full_name ?? '')
  const [phone, setPhone] = useState(client.phone ?? '')
  const [email, setEmail] = useState(client.email)
  const [loading, setLoading] = useState(false)

  const inputClass = 'h-10 w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave({ full_name: fullName, phone, email })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2A3040] bg-[#1A1F2B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A3040] px-6 py-4">
          <h2 className="text-base font-semibold text-white">Client bewerken</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">Naam</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jan de Vries" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">Telefoon</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31612345678" className={inputClass} />
          </div>

          {/* Immutable fields warning */}
          <div className="flex items-start gap-2 rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <p className="text-xs text-[#94A3B8]">
              Bedrijfsnaam, KVK en BTW nummer kunnen niet worden gewijzigd.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#2A3040] py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors">
              Annuleren
            </button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#2D7FF9] py-2.5 text-sm font-medium text-white hover:bg-[#2070e0] transition-colors disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// Delete Modal
// =====================================================

function DeleteClientModal({
  clientName,
  onClose,
  onConfirm,
}: {
  clientName: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[#EF4444]/30 bg-[#1A1F2B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A3040] px-6 py-4">
          <h2 className="text-base font-semibold text-white">Client verwijderen</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-[#EF4444] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white mb-1">Dit verwijdert permanent:</p>
              <ul className="text-xs text-[#94A3B8] space-y-1">
                {['Alle ad accounts', 'Wallet & transacties', 'Facturen', 'Account toegang'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-[#EF4444]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">
              Typ <code className="rounded bg-[#141920] px-1.5 py-0.5 text-[#EF4444]">DELETE</code> om te bevestigen
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="h-10 w-full rounded-lg border border-[#EF4444]/30 bg-[#141920] px-3 text-sm text-white placeholder-[#4A5568] focus:border-[#EF4444] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#2A3040] px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#2A3040] py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors">
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmText !== 'DELETE' || loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#EF4444] py-2.5 text-sm font-medium text-white hover:bg-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Permanent verwijderen
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Platform Badge
// =====================================================

const PLATFORM_COLORS: Record<string, string> = {
  meta: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  google: 'bg-green-500/10 text-green-400 border-green-500/20',
  tiktok: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

function PlatformBadge({ platform }: { platform: string }) {
  const color = PLATFORM_COLORS[platform] ?? 'bg-[#2A3040] text-[#94A3B8] border-[#2A3040]'
  const labels: Record<string, string> = { meta: 'Meta', google: 'Google', tiktok: 'TikTok' }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
      {labels[platform] ?? platform}
    </span>
  )
}

// =====================================================
// Main Page
// =====================================================

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'accounts' | 'info'>('accounts')
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`)
      if (!res.ok) {
        toast.error('Client niet gevonden')
        router.push('/agency/management/users')
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Kon client niet laden')
    } finally {
      setLoading(false)
    }
  }, [clientId, router])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  const handleEdit = async (updates: { full_name: string; phone: string; email: string }) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error()
      toast.success('Client bijgewerkt')
      setShowEdit(false)
      fetchClient()
    } catch {
      toast.error('Bijwerken mislukt')
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Client verwijderd')
      router.push('/agency/management/users')
    } catch {
      toast.error('Verwijderen mislukt')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-[#2D7FF9]" />
      </div>
    )
  }

  if (!data) return null

  const { user, wallet, adAccounts, stats } = data
  const displayName = user.full_name ?? user.email
  const initials = displayName.charAt(0).toUpperCase()
  const memberSince = formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: nl })

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug
      </button>

      {/* Profile header */}
      <div className="rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2D7FF9]/10 border-2 border-[#2D7FF9]/20">
              <span className="text-xl font-bold text-[#2D7FF9]">{initials}</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{displayName}</h1>
              {user.company_name && (
                <p className="text-sm text-[#94A3B8]">{user.company_name}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 text-xs text-[#10B981]">
                  <CheckCircle className="h-3 w-3" />
                  Actief
                </span>
                <span className="text-xs text-[#4A5568]">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors"
            >
              <Edit className="h-4 w-4" />
              Bewerken
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Verwijderen
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Actieve accounts', value: stats.activeAdAccounts, icon: Megaphone, color: '#2D7FF9' },
            { label: 'Wallet saldo', value: formatCurrency(stats.walletBalance), icon: Wallet, color: '#10B981' },
            { label: 'Totaal gestort', value: formatCurrency(stats.totalTopUps), icon: CreditCard, color: '#F59E0B' },
            { label: 'Totaal uitgegeven', value: formatCurrency(stats.totalSpent), icon: CreditCard, color: '#94A3B8' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg bg-[#141920] border border-[#2A3040] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                <span className="text-xs text-[#4A5568]">{label}</span>
              </div>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[#2A3040] bg-[#141920] p-1 w-fit">
        {[
          { key: 'accounts' as const, label: 'Ad Accounts' },
          { key: 'info' as const, label: 'Klantinformatie' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-[#2D7FF9] text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#2A3040]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Ad Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-3">
          {adAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#2A3040] bg-[#1A1F2B] py-16 text-center">
              <Megaphone className="h-8 w-8 text-[#2A3040] mb-3" />
              <p className="text-sm text-[#94A3B8]">Geen ad accounts</p>
            </div>
          ) : (
            adAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-xl border border-[#2A3040] bg-[#1A1F2B] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141920]">
                    <Megaphone className="h-4 w-4 text-[#2D7FF9]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformBadge platform={account.platform} />
                      <span className="text-xs text-[#4A5568]">{account.fee_percentage}% fee</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(account.balance_cents)}</p>
                  <span className={`text-xs font-medium ${account.status === 'active' ? 'text-[#10B981]' : 'text-[#4A5568]'}`}>
                    {account.status === 'active' ? 'Actief' : 'Inactief'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Client info */}
      {activeTab === 'info' && (
        <div className="rounded-xl border border-[#2A3040] bg-[#1A1F2B] divide-y divide-[#2A3040]">
          {[
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Phone, label: 'Telefoon', value: user.phone ?? '—' },
            { icon: Building2, label: 'Bedrijf', value: user.company_name ?? '—' },
            { icon: Calendar, label: 'Lid sinds', value: memberSince },
            { icon: Wallet, label: 'Wallet saldo', value: formatCurrency(wallet?.balance_cents ?? 0) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#141920]">
                <Icon className="h-4 w-4 text-[#4A5568]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#4A5568]">{label}</p>
                <p className="text-sm text-white truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <EditClientModal
          client={user}
          onClose={() => setShowEdit(false)}
          onSave={handleEdit}
        />
      )}
      {showDelete && (
        <DeleteClientModal
          clientName={displayName}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
