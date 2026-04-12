import { calculateFee } from '@/lib/utils/fees'

interface FeeCalculatorProps {
  /** Ad account top-up amount in euros */
  amount: number
  /** Fee percentage (e.g. 5 for 5%) */
  feePercentage: number
}

/**
 * Displays a breakdown of the fee calculation for a given top-up amount.
 * Hidden when amount is 0. VAT applies only to the fee, not the ad amount.
 */
export function FeeCalculator({ amount, feePercentage }: FeeCalculatorProps) {
  if (amount === 0) return null

  const breakdown = calculateFee(amount, feePercentage)

  const formatEuros = (value: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)

  const rows = [
    { label: 'Ad Account Amount', value: formatEuros(breakdown.adAmount) },
    { label: `Top-up Fee (${feePercentage}%)`, value: formatEuros(breakdown.fee) },
    { label: 'VAT (21% of fee)', value: formatEuros(breakdown.vat) },
  ]

  return (
    <div className="rounded-xl border border-[#2D7FF9]/20 bg-[#2D7FF9]/10 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#2D7FF9]">
        Fee Breakdown
      </p>
      <div className="space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-[#94A3B8]">{label}</span>
            <span className="text-sm text-white">{value}</span>
          </div>
        ))}
        <div className="my-2 border-t border-[#2D7FF9]/20" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Total to Pay</span>
          <span className="text-sm font-bold text-[#2D7FF9]">{formatEuros(breakdown.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default FeeCalculator
