import { ClipboardList, AlertCircle } from 'lucide-react'
import { type AdAccountRequest, type RequestStatus, type Platform } from '@/types/database.types'
import { cn } from '@/lib/utils'

interface RequestHistoryListProps {
  requests: AdAccountRequest[]
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  approved: 'bg-[#10B981]/10 text-[#10B981]',
  rejected: 'bg-[#EF4444]/10 text-[#EF4444]',
}

const PLATFORM_LABELS: Record<Platform, string> = {
  meta: 'Meta',
  google: 'Google',
  tiktok: 'TikTok',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Displays a list of ad account requests with their status and rejection reasons.
 */
export function RequestHistoryList({ requests }: RequestHistoryListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#2A3040] bg-[#141920] py-16 text-center">
        <ClipboardList className="h-10 w-10 text-[#4A5568] mb-4" />
        <p className="text-sm font-medium text-white">No requests yet</p>
        <p className="text-xs text-[#94A3B8] mt-1">
          Your ad account requests will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2A3040] bg-[#141920] overflow-hidden">
      <div className="divide-y divide-[#2A3040]">
        {requests.map((req) => (
          <div key={req.id} className="px-4 py-4 hover:bg-[#1A1F2B] transition-colors">
            <div className="flex items-center justify-between gap-4">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{req.accountName}</p>
                  <span className="shrink-0 rounded-full bg-[#2A3040] px-2 py-0.5 text-xs text-[#94A3B8]">
                    {PLATFORM_LABELS[req.platform]}
                  </span>
                </div>
                <p className="text-xs text-[#4A5568] mt-0.5">{req.domainName}</p>
              </div>

              {/* Status + Date */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    STATUS_STYLES[req.status]
                  )}
                >
                  {req.status}
                </span>
                <p className="text-xs text-[#4A5568]">{formatDate(req.createdAt)}</p>
              </div>
            </div>

            {/* Rejection reason */}
            {req.status === 'rejected' && req.rejectionReason && (
              <div className="mt-3 flex gap-2 rounded-lg bg-[#EF4444]/10 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#EF4444] mt-0.5" />
                <p className="text-xs text-[#EF4444]">{req.rejectionReason}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default RequestHistoryList
