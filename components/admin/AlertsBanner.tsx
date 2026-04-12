'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AdminAlert } from '@/app/api/admin/alerts/route'

/**
 * AlertsBanner fetches admin alerts and displays a prominent banner
 * when critical or warning alerts exist. Renders nothing if no alerts.
 */
export function AlertsBanner() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([])
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/admin/alerts')
        if (!res.ok) return
        const data: AdminAlert[] = await res.json()
        setAlerts(data)
      } catch {
        // Silently fail — alerts are non-critical UI
      }
    }

    fetchAlerts()
  }, [])

  if (dismissed || alerts.length === 0) return null

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
  const warningAlerts = alerts.filter((a) => a.severity === 'warning')
  const hasCritical = criticalAlerts.length > 0

  const primaryAlert = criticalAlerts[0] ?? warningAlerts[0]
  const totalCount = alerts.reduce((sum, a) => sum + a.count, 0)

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${
        hasCritical
          ? 'border-[#EF4444]/20 bg-[#EF4444]/5'
          : 'border-[#F59E0B]/20 bg-[#F59E0B]/5'
      }`}
    >
      <button
        onClick={() => router.push(primaryAlert.actionUrl)}
        className="flex items-start gap-3 flex-1 text-left"
      >
        {hasCritical ? (
          <AlertCircle className="h-5 w-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`text-sm font-semibold ${hasCritical ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
            {hasCritical
              ? `${criticalAlerts.length} Critical Alert${criticalAlerts.length > 1 ? 's' : ''} — Require immediate attention`
              : `${warningAlerts.length} Warning${warningAlerts.length > 1 ? 's' : ''} — Review recommended`}
          </p>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {alerts.map((a) => a.message).join(' · ')}
            {totalCount > 0 && ` · ${totalCount} item${totalCount > 1 ? 's' : ''} total`}
          </p>
        </div>
      </button>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss alerts"
        className="flex-shrink-0 text-[#4A5568] hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default AlertsBanner
