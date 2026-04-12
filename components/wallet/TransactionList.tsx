import { ArrowDownCircle, ArrowUpCircle, ReceiptText } from 'lucide-react'
import { type Transaction, type TransactionStatus } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

interface TransactionListProps {
  transactions: Transaction[]
}

/** Returns status badge styling for a transaction status */
function getStatusStyle(status: TransactionStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-[#10B981]/10 text-[#10B981]'
    case 'pending':
      return 'bg-[#F59E0B]/10 text-[#F59E0B]'
    case 'rejected':
      return 'bg-[#EF4444]/10 text-[#EF4444]'
  }
}

/** Outgoing types: transfer (money leaving wallet to ad account) */
function isOutgoing(type: Transaction['type']): boolean {
  return type === 'transfer'
}

/** Format a UTC date string to locale date+time */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Human-readable label for transaction type */
function typeLabel(type: Transaction['type']): string {
  switch (type) {
    case 'top_up': return 'Top-Up'
    case 'transfer': return 'Transfer'
    case 'refund': return 'Refund'
    case 'adjustment': return 'Adjustment'
  }
}

/**
 * Renders a list of wallet transactions.
 * Outgoing (transfer) shown with ↑ icon, incoming (deposit/refund) with ↓.
 */
export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#2A3040] bg-[#141920] py-16 text-center">
        <ReceiptText className="h-10 w-10 text-[#4A5568] mb-4" />
        <p className="text-sm font-medium text-white">No transactions yet</p>
        <p className="text-xs text-[#94A3B8] mt-1">Transactions will appear here once you add funds</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2A3040] bg-[#141920] overflow-hidden">
      <div className="divide-y divide-[#2A3040]">
        {transactions.map((tx) => {
          const outgoing = isOutgoing(tx.type)

          return (
            <div
              key={tx.id}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-[#1A1F2B] transition-colors"
            >
              {/* Direction icon */}
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  outgoing ? 'bg-[#EF4444]/10' : 'bg-[#10B981]/10'
                )}
              >
                {outgoing ? (
                  <ArrowUpCircle className="h-4 w-4 text-[#EF4444]" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 text-[#10B981]" />
                )}
              </div>

              {/* Type + date */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{typeLabel(tx.type)}</p>
                <p className="text-xs text-[#4A5568]">{formatDate(tx.createdAt)}</p>
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  getStatusStyle(tx.status)
                )}
              >
                {tx.status}
              </span>

              {/* Amount */}
              <p
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  outgoing ? 'text-[#EF4444]' : 'text-[#10B981]'
                )}
              >
                {outgoing ? '-' : '+'}{formatCurrency(tx.amountCents)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TransactionList
