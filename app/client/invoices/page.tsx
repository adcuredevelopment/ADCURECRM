'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, Receipt, TrendingUp, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

type InvoiceStatus = 'created' | 'sent' | 'paid'
type StatusFilter = 'all' | InvoiceStatus

interface RawInvoice {
  id: string
  organization_id: string
  transaction_id: string
  invoice_number: string
  moneybird_id: string | null
  amount_cents: number
  vat_cents: number
  total_cents: number
  status: InvoiceStatus
  pdf_url: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  created: 'Created',
  sent: 'Sent',
  paid: 'Paid',
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  created: 'bg-[#4A5568]/20 text-[#94A3B8] border border-[#4A5568]/30',
  sent: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
  paid: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20',
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'created', label: 'Created' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Single stat card for the summary section */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-[#1A1F2B] border border-[#2A3040] p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-[#2D7FF9]/10 text-[#2D7FF9]">{icon}</div>
        <span className="text-sm text-[#94A3B8]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

/** Loading skeleton row */
function SkeletonRow() {
  return (
    <div className="h-14 animate-pulse rounded-xl bg-[#141920] border border-[#2A3040]" />
  )
}

/**
 * Client Invoices page — shows all invoices for the current organization.
 */
export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<RawInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data as RawInvoice[])
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Filter invoices by status and search query
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    const matchesSearch =
      searchQuery === '' ||
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Compute stat values
  const totalCount = invoices.length
  const totalAmountCents = invoices.reduce((sum, inv) => sum + inv.total_cents, 0)
  const latestInvoiceDate =
    invoices.length > 0
      ? formatDate(invoices[0].created_at)
      : '—'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Your invoices are automatically generated when deposits are approved.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Receipt className="h-4 w-4" />}
          label="Total Invoices"
          value={String(totalCount)}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Amount"
          value={totalCount > 0 ? formatCurrency(totalAmountCents) : '€0,00'}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Latest Invoice"
          value={latestInvoiceDate}
        />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search invoice number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 rounded-lg bg-[#1A1F2B] border border-[#2A3040] px-4 py-2.5 text-sm text-white placeholder:text-[#4A5568] focus:outline-none focus:border-[#2D7FF9] transition-colors"
        />

        {/* Status tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-[#141920] border border-[#2A3040] p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-[#2D7FF9] text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <EmptyState hasInvoices={invoices.length > 0} />
      ) : (
        <InvoiceTable invoices={filteredInvoices} />
      )}
    </div>
  )
}

/** Empty state component */
function EmptyState({ hasInvoices }: { hasInvoices: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-[#1A1F2B] border border-[#2A3040] py-16 text-center">
      <FileText className="h-10 w-10 text-[#4A5568] mb-4" />
      <h3 className="text-base font-semibold text-white mb-2">
        {hasInvoices ? 'No invoices match your filters' : 'No invoices yet'}
      </h3>
      <p className="text-sm text-[#94A3B8] max-w-sm">
        {hasInvoices
          ? 'Try adjusting your search or status filter.'
          : 'Invoices are automatically generated when your deposits are approved.'}
      </p>
    </div>
  )
}

/** Invoice table component */
function InvoiceTable({ invoices }: { invoices: RawInvoice[] }) {
  return (
    <div className="rounded-xl bg-[#1A1F2B] border border-[#2A3040] overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-[#2A3040] bg-[#141920]">
        <span className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Invoice #</span>
        <span className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Date</span>
        <span className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Amount</span>
        <span className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">VAT</span>
        <span className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Total</span>
        <span className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Status</span>
        <span className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">PDF</span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-[#2A3040]">
        {invoices.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </div>
  )
}

/** Single invoice table row */
function InvoiceRow({ invoice }: { invoice: RawInvoice }) {
  const hasPdf = !!invoice.pdf_url

  return (
    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-[#141920] transition-colors">
      {/* Invoice number */}
      <span className="text-sm font-bold text-[#2D7FF9] font-mono">
        {invoice.invoice_number}
      </span>

      {/* Date */}
      <span className="text-sm text-[#94A3B8]">
        {formatDate(invoice.created_at)}
      </span>

      {/* Amount excl. VAT */}
      <span className="text-sm text-[#94A3B8]">
        {formatCurrency(invoice.amount_cents)}
      </span>

      {/* VAT */}
      <span className="text-sm text-[#94A3B8]">
        {formatCurrency(invoice.vat_cents)}
      </span>

      {/* Total incl. VAT */}
      <span className="text-sm font-bold text-white">
        {formatCurrency(invoice.total_cents)}
      </span>

      {/* Status badge */}
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium w-fit ${STATUS_COLORS[invoice.status]}`}
      >
        {STATUS_LABELS[invoice.status]}
      </span>

      {/* Download button */}
      {hasPdf ? (
        <a
          href={invoice.pdf_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D7FF9]/10 text-[#2D7FF9] border border-[#2D7FF9]/20 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#2D7FF9]/20"
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2A3040] text-[#4A5568] border border-[#2A3040] px-3 py-1.5 text-xs font-medium cursor-not-allowed"
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </button>
      )}
    </div>
  )
}
