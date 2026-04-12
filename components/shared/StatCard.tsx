import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// =====================================================
// Types
// =====================================================

type StatCardColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple'

interface Trend {
  value: number     // Percentage change (positive = up, negative = down)
  label: string     // e.g., "vs last month"
}

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: Trend
  color?: StatCardColor
  subtitle?: string
  className?: string
}

// =====================================================
// Color configurations
// =====================================================

const colorConfig: Record<StatCardColor, { icon: string; bg: string; badge: string }> = {
  blue: {
    icon: 'text-[#2D7FF9]',
    bg: 'bg-[#2D7FF9]/10',
    badge: 'text-[#2D7FF9] bg-[#2D7FF9]/10',
  },
  green: {
    icon: 'text-[#10B981]',
    bg: 'bg-[#10B981]/10',
    badge: 'text-[#10B981] bg-[#10B981]/10',
  },
  yellow: {
    icon: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
    badge: 'text-[#F59E0B] bg-[#F59E0B]/10',
  },
  red: {
    icon: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/10',
    badge: 'text-[#EF4444] bg-[#EF4444]/10',
  },
  purple: {
    icon: 'text-[#8B5CF6]',
    bg: 'bg-[#8B5CF6]/10',
    badge: 'text-[#8B5CF6] bg-[#8B5CF6]/10',
  },
}

// =====================================================
// Format large numbers (1500 → 1.5K, 1500000 → 1.5M)
// =====================================================
function formatValue(value: string | number): string {
  if (typeof value === 'string') return value

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toString()
}

// =====================================================
// StatCard Component
// =====================================================

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  subtitle,
  className,
}: StatCardProps) {
  const colors = colorConfig[color]
  const isPositiveTrend = trend && trend.value >= 0

  return (
    <div
      className={cn(
        'rounded-xl border border-[#2A3040] bg-[#141920] p-5 transition-colors hover:border-[#3A4050]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={cn('rounded-lg p-2.5', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>

        {/* Trend Badge */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              isPositiveTrend
                ? 'text-[#10B981] bg-[#10B981]/10'
                : 'text-[#EF4444] bg-[#EF4444]/10'
            )}
          >
            {isPositiveTrend ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-2xl font-bold text-white tracking-tight">
          {formatValue(value)}
        </p>

        {/* Title */}
        <p className="mt-1 text-sm text-[#94A3B8]">{title}</p>

        {/* Subtitle / Trend label */}
        {(subtitle || trend) && (
          <p className="mt-0.5 text-xs text-[#4A5568]">
            {subtitle ?? trend?.label}
          </p>
        )}
      </div>
    </div>
  )
}

export default StatCard
