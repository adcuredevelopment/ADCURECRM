'use client'

import { useState } from 'react'
import { Search, Megaphone } from 'lucide-react'
import { type AdAccount } from '@/types/database.types'
import { AdAccountCard } from './AdAccountCard'

interface AdAccountListProps {
  accounts: AdAccount[]
  onTopUp: (account: AdAccount) => void
}

/**
 * Searchable grid of AdAccountCards.
 * Filters accounts by name using a client-side search input.
 */
export function AdAccountList({ accounts, onTopUp }: AdAccountListProps) {
  const [search, setSearch] = useState('')

  const filtered = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5568]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ad accounts..."
          className="h-10 w-full rounded-lg border border-[#2A3040] bg-[#141920] pl-9 pr-3 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20"
        />
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#2A3040] bg-[#141920] py-16 text-center">
          <Megaphone className="h-10 w-10 text-[#4A5568] mb-4" />
          <p className="text-sm font-medium text-white">
            {search ? 'No accounts match your search' : 'No ad accounts yet'}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            {search ? 'Try a different search term' : 'Request your first ad account to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((account) => (
            <AdAccountCard key={account.id} account={account} onTopUp={onTopUp} />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdAccountList
