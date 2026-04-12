'use client'

import { cn } from '@/lib/utils'

export interface TransactionFilterState {
  type: string
  status: string
  sort: string
  from: string
  to: string
}

interface TransactionFiltersProps {
  filters: TransactionFilterState
  onChange: (filters: TransactionFilterState) => void
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'top_up', label: 'Top-Up' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'refund', label: 'Refund' },
  { value: 'adjustment', label: 'Adjustment' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Amount' },
]

const selectClass = cn(
  'h-9 rounded-lg border border-[#2A3040] bg-[#141920] px-3 text-sm text-white',
  'focus:outline-none focus:ring-2 focus:ring-[#2D7FF9] focus:border-transparent',
  'transition-colors hover:border-[#3A4050]'
)

const inputClass = cn(
  'h-9 rounded-lg border border-[#2A3040] bg-[#141920] px-3 text-sm text-white',
  'focus:outline-none focus:ring-2 focus:ring-[#2D7FF9] focus:border-transparent',
  'transition-colors hover:border-[#3A4050]',
  '[color-scheme:dark]'
)

/**
 * Filter controls for transaction list: type, status, sort, and date range.
 */
export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const update = (key: keyof TransactionFilterState, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Type */}
      <select
        value={filters.type}
        onChange={(e) => update('type', e.target.value)}
        className={selectClass}
        aria-label="Filter by type"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => update('status', e.target.value)}
        className={selectClass}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filters.sort}
        onChange={(e) => update('sort', e.target.value)}
        className={selectClass}
        aria-label="Sort transactions"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Date Range */}
      <input
        type="date"
        value={filters.from}
        onChange={(e) => update('from', e.target.value)}
        className={inputClass}
        aria-label="From date"
        placeholder="From"
      />
      <input
        type="date"
        value={filters.to}
        onChange={(e) => update('to', e.target.value)}
        className={inputClass}
        aria-label="To date"
        placeholder="To"
      />
    </div>
  )
}

export default TransactionFilters
