'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { FileUpload } from '@/components/shared/FileUpload'
import { CopyButton } from '@/components/shared/CopyButton'
import { eurosToCents, formatCurrency } from '@/lib/utils/currency'

interface AddFundsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const QUICK_AMOUNTS_EUROS = [50, 100, 250, 500, 1000]
const MIN_AMOUNT_EUROS = 10

const BANK_DETAILS = {
  beneficiary: 'Adcure Agency',
  iban: 'NL14REV0766119691',
  bic: 'REV0NL22',
}

/**
 * Modal for adding funds to the wallet via bank transfer.
 * Lets the user choose an amount, provides bank details, and submits a deposit request.
 */
export function AddFundsModal({ isOpen, onClose, onSuccess }: AddFundsModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [reference, setReference] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const resolvedAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0)
  const isValidAmount = resolvedAmount >= MIN_AMOUNT_EUROS

  const handleQuickAmount = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const handleSubmit = async () => {
    if (!isValidAmount) {
      setError(`Minimum amount is ${formatCurrency(eurosToCents(MIN_AMOUNT_EUROS))}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: eurosToCents(resolvedAmount),
          reference: reference || undefined,
          proof_url: proofUrl || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Failed to submit deposit request')
        return
      }

      onSuccess()
      handleClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedAmount(null)
    setCustomAmount('')
    setReference('')
    setProofUrl('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-[#2A3040] bg-[#1A1F2B] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A3040] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Add Funds</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-[#2A3040] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Quick amount selection */}
          <div>
            <label className="mb-3 block text-sm font-medium text-white">Select Amount</label>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_AMOUNTS_EUROS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAmount(amount)}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    selectedAmount === amount
                      ? 'border-[#2D7FF9] bg-[#2D7FF9]/10 text-[#2D7FF9]'
                      : 'border-[#2A3040] bg-[#141920] text-[#94A3B8] hover:border-[#3A4050] hover:text-white'
                  }`}
                >
                  €{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="custom-amount">
              Or enter custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#4A5568]">€</span>
              <input
                id="custom-amount"
                type="number"
                min={MIN_AMOUNT_EUROS}
                step="1"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-lg border border-[#2A3040] bg-[#141920] pl-7 pr-3 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20"
              />
            </div>
            <p className="mt-1 text-xs text-[#4A5568]">Minimum €{MIN_AMOUNT_EUROS}</p>
          </div>

          {/* Bank details */}
          <div className="rounded-xl border border-[#2A3040] bg-[#141920] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Bank Transfer Details
            </p>
            <div className="space-y-2.5">
              {[
                { label: 'Beneficiary', value: BANK_DETAILS.beneficiary },
                { label: 'IBAN', value: BANK_DETAILS.iban, mono: true },
                { label: 'BIC', value: BANK_DETAILS.bic, mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#94A3B8]">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs text-white ${mono ? 'font-mono' : 'font-medium'}`}>
                      {value}
                    </span>
                    <CopyButton value={value} label={label} />
                  </div>
                </div>
              ))}
              <div className="mt-2 rounded-lg bg-[#2D7FF9]/10 px-3 py-2">
                <p className="text-xs text-[#2D7FF9]">
                  Please use your email address as payment reference
                </p>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="reference">
              Payment Reference <span className="text-[#4A5568]">(optional)</span>
            </label>
            <input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Your transaction reference"
              className="h-10 w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20"
            />
          </div>

          {/* Proof upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Upload Proof of Payment <span className="text-[#4A5568]">(optional)</span>
            </label>
            <FileUpload onUpload={setProofUrl} />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-[#EF4444]/10 px-4 py-3">
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[#2A3040] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-[#2A3040] py-2.5 text-sm font-medium text-[#94A3B8] transition-colors hover:bg-[#2A3040] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValidAmount || loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#2D7FF9] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2D7FF9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isValidAmount
              ? `Submit ${formatCurrency(eurosToCents(resolvedAmount))} Request`
              : 'Add Funds'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddFundsModal
