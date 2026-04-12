import { Wallet, Clock, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { formatCurrency } from '@/lib/utils/currency'

interface WalletStatsProps {
  /** Available balance in cents */
  balance: number
  /** Pending transactions total in cents */
  pending: number
  /** Total deposited (completed top-ups) in cents */
  deposited: number
  /** Total spent (completed transfers) in cents */
  spent: number
}

/**
 * Displays four wallet stats: Available, Pending, Deposited, Spent.
 * All amounts are passed in cents and formatted as euros.
 */
export function WalletStats({ balance, pending, deposited, spent }: WalletStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Available Balance"
        value={formatCurrency(balance)}
        icon={Wallet}
        color="green"
      />
      <StatCard
        title="Pending"
        value={formatCurrency(pending)}
        icon={Clock}
        color="yellow"
      />
      <StatCard
        title="Total Deposited"
        value={formatCurrency(deposited)}
        icon={ArrowDownCircle}
        color="blue"
      />
      <StatCard
        title="Total Spent"
        value={formatCurrency(spent)}
        icon={ArrowUpCircle}
        color="purple"
      />
    </div>
  )
}

export default WalletStats
