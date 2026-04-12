import { ArrowUpCircle } from 'lucide-react'
import { type AdAccount, type Platform } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

interface AdAccountCardProps {
  account: AdAccount
  onTopUp: (account: AdAccount) => void
}

const PLATFORM_LABELS: Record<Platform, string> = {
  meta: 'Meta',
  google: 'Google',
  tiktok: 'TikTok',
}

const PLATFORM_COLORS: Record<Platform, string> = {
  meta: 'bg-[#1877F2]/10 text-[#1877F2]',
  google: 'bg-[#EA4335]/10 text-[#EA4335]',
  tiktok: 'bg-[#000000]/30 text-[#94A3B8]',
}

const STATUS_STYLES = {
  active: 'bg-[#10B981]/10 text-[#10B981]',
  disabled: 'bg-[#4A5568]/20 text-[#4A5568]',
}

/**
 * Card displaying a single ad account with its key details and a top-up action.
 */
export function AdAccountCard({ account, onTopUp }: AdAccountCardProps) {
  return (
    <div className="group rounded-xl border border-[#2A3040] bg-[#141920] p-5 transition-all hover:border-[#3A4050] hover:bg-[#1A1F2B]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white" title={account.name}>
            {account.name}
          </h3>
          <p className="mt-0.5 text-xs text-[#4A5568]">{account.accountId}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              PLATFORM_COLORS[account.platform]
            )}
          >
            {PLATFORM_LABELS[account.platform]}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
              STATUS_STYLES[account.status]
            )}
          >
            {account.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-[#4A5568]">Balance</p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {formatCurrency(account.balanceCents, account.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#4A5568]">Fee</p>
          <p className="text-sm font-semibold text-white mt-0.5">{account.feePercentage}%</p>
        </div>
        <div>
          <p className="text-xs text-[#4A5568]">Currency</p>
          <p className="text-sm font-semibold text-white mt-0.5">{account.currency}</p>
        </div>
      </div>

      {/* Action */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => onTopUp(account)}
          disabled={account.status === 'disabled'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#2A3040] py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:border-[#2D7FF9] hover:bg-[#2D7FF9]/10 hover:text-[#2D7FF9] disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowUpCircle className="h-4 w-4" />
          Request Top-Up
        </button>
      </div>
    </div>
  )
}

export default AdAccountCard
