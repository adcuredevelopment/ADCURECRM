'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface RevenueDataPoint {
  date: string
  revenue: number
}

const DAY_LABELS: Record<string, string> = {
  '0': 'Sun',
  '1': 'Mon',
  '2': 'Tue',
  '3': 'Wed',
  '4': 'Thu',
  '5': 'Fri',
  '6': 'Sat',
}

/** Format a YYYY-MM-DD string to a short day label */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return DAY_LABELS[date.getDay().toString()] ?? dateStr
}

/** Format cents as euro string for tooltip */
function formatEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-[#2A3040] bg-[#1A1F2B] px-3 py-2 shadow-lg">
      <p className="text-xs text-[#94A3B8]">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">
        {formatEuros(payload[0].value)}
      </p>
    </div>
  )
}

/**
 * RevenueChart fetches 7-day revenue data and renders an area chart.
 * Uses Recharts with a blue gradient fill on a dark theme background.
 */
export function RevenueChart() {
  const [data, setData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await fetch('/api/admin/revenue')
        if (!res.ok) return
        const raw: RevenueDataPoint[] = await res.json()
        setData(raw)
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()
  }, [])

  const chartData = data.map((d) => ({
    day: formatDateLabel(d.date),
    revenue: d.revenue,
  }))

  return (
    <div className="rounded-xl border border-[#2A3040] bg-[#141920] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Revenue (Last 7 Days)</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">Completed top-up deposits</p>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-lg bg-[#1A1F2B]" />
      ) : (
        <ResponsiveContainer width="100%" height={192}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D7FF9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2D7FF9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3040" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatEuros(v)}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2A3040' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2D7FF9"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#2D7FF9', stroke: '#0A0E14', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default RevenueChart
