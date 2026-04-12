'use client'

import { Clock, Megaphone, Wallet, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PendingActionsWidgetProps {
  pendingRequests: number
  pendingDeposits: number
}

interface ActionItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  href: string
  color: string
}

/**
 * PendingActionsWidget displays a list of pending admin actions
 * with links to the relevant pages.
 */
export function PendingActionsWidget({
  pendingRequests,
  pendingDeposits,
}: PendingActionsWidgetProps) {
  const items: ActionItem[] = [
    {
      icon: Megaphone,
      label: 'Account requests awaiting review',
      count: pendingRequests,
      href: '/agency/ad-accounts?status=pending',
      color: 'text-[#2D7FF9]',
    },
    {
      icon: Wallet,
      label: 'Deposit proofs awaiting verification',
      count: pendingDeposits,
      href: '/agency/wallets?tab=pending',
      color: 'text-[#F59E0B]',
    },
  ]

  const hasActions = pendingRequests > 0 || pendingDeposits > 0

  return (
    <div className="rounded-xl border border-[#2A3040] bg-[#141920] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-[#94A3B8]" />
        <h3 className="text-sm font-semibold text-white">Pending Actions</h3>
      </div>

      {!hasActions ? (
        <div className="py-6 text-center">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#10B981]/10 mx-auto mb-3">
            <Clock className="h-5 w-5 text-[#10B981]" />
          </div>
          <p className="text-sm text-[#94A3B8]">No pending actions</p>
          <p className="text-xs text-[#4A5568] mt-1">All tasks are up to date</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            if (item.count === 0) return null
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg border border-[#2A3040] bg-[#1A1F2B] hover:border-[#3A4050] hover:bg-[#1E2433] p-3 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#2A3040] group-hover:bg-[#3A4050] transition-colors">
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.count} {item.count === 1 ? 'item' : 'items'}
                    </p>
                    <p className="text-xs text-[#94A3B8]">{item.label}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#4A5568] group-hover:text-[#94A3B8] transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PendingActionsWidget
