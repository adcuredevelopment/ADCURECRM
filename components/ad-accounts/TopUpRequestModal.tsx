'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Clock } from 'lucide-react'
import { type AdAccount } from '@/types/database.types'
import { FeeCalculator } from './FeeCalculator'
import { FileUpload } from '@/components/shared/FileUpload'
import { formatCurrency, centsToEuros, eurosToCents } from '@/lib/utils/currency'
import { calculateFee } from '@/lib/utils/fees'

interface TopUpRequestModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: AdAccount[]
  selectedAccount?: AdAccount
  walletBalanceCents: number
  onSuccess: () => void
}

type PaymentMethod = 'wallet' | 'bank_transfer'

/**
 * Modal for requesting an ad account top-up.
 * Supports wallet payment (instant) and bank transfer (requires proof).
 */
export function TopUpRequestModal({
  isOpen,
  onClose,
  accounts,
  selectedAccount,
  walletBalanceCents,
  onSuccess,
}: TopUpRequestModalProps) {
  const [accountId, setAccountId] = useState(selectedAccount?.id ?? '')
  const [amountStr, setAmountStr] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet')
  const [proofUrl, setProofUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync account selection when selectedAccount prop changes
  useEffect(() => {
    if (selectedAccount) setAccountId(selectedAccount.id)
  }, [selectedAccount])

  if (!isOpen) return null

  const activeAccounts = accounts.filter((a) => a.status === 'active')
  const currentAccount = accounts.find((a) => a.id === accountId)
  const amountEuros = parseFloat(amountStr) || 0
  const breakdown = currentAccount && amountEuros > 0
    ? calculateFee(amountEuros, currentAccount.feePercentage)
    : null
  const totalCents = breakdown ? eurosToCents(breakdown.total) : 0

  const hasInsufficientBalance = paymentMethod === 'wallet' && totalCents > walletBalanceCents

  const isValid =
    accountId &&
    amountEuros > 0 &&
    !hasInsufficientBalance &&
    (paymentMethod === 'wallet' || (paymentMethod === 'bank_transfer' && proofUrl))

  const handleSubmit = async () => {
    if (!isValid || !currentAccount) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ad-accounts/${currentAccount.id}/top-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: eurosToCents(amountEuros),
          payment_method: paymentMethod,
          proof_url: proofUrl || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Failed to submit top-up request')
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
    setAccountId(selectedAccount?.id ?? '')
    setAmountStr('')
    setPaymentMethod('wallet')
    setProofUrl('')
    setNotes('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-[#2A3040] bg-[#1A1F2B] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A3040] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Request Top-Up</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-[#2A3040] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Account selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="account-select">
              Ad Account
            </label>
            <select
              id="account-select"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 text-sm text-white focus:border-[#2D7FF9] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20"
            >
              <option value="">Select an account...</option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.platform} · {acc.feePercentage}% fee)
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="amount-input">
              Top-Up Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#4A5568]">€</span>
              <input
                id="amount-input"
                type="number"
                min="1"
                step="1"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-lg border border-[#2A3040] bg-[#141920] pl-7 pr-3 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20"
              />
            </div>
          </div>

          {/* Fee calculator */}
          {currentAccount && (
            <FeeCalculator amount={amountEuros} feePercentage={currentAccount.feePercentage} />
          )}

          {/* Payment method */}
          <div>
            <label className="mb-3 block text-sm font-medium text-white">Payment Method</label>
            <div className="space-y-2">
              {/* Wallet option */}
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors ${
                  paymentMethod === 'wallet'
                    ? 'border-[#2D7FF9] bg-[#2D7FF9]/10'
                    : 'border-[#2A3040] bg-[#141920] hover:border-[#3A4050]'
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={() => setPaymentMethod('wallet')}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'wallet' ? 'border-[#2D7FF9]' : 'border-[#4A5568]'
                }`}>
                  {paymentMethod === 'wallet' && (
                    <div className="h-2 w-2 rounded-full bg-[#2D7FF9]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">Pay from Wallet</span>
                    <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-xs font-medium text-[#10B981]">
                      10 Min
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5568] mt-0.5">
                    Balance: {formatCurrency(walletBalanceCents)}
                  </p>
                </div>
              </label>

              {/* Bank Transfer option */}
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-[#2D7FF9] bg-[#2D7FF9]/10'
                    : 'border-[#2A3040] bg-[#141920] hover:border-[#3A4050]'
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'bank_transfer' ? 'border-[#2D7FF9]' : 'border-[#4A5568]'
                }`}>
                  {paymentMethod === 'bank_transfer' && (
                    <div className="h-2 w-2 rounded-full bg-[#2D7FF9]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">Bank Transfer</span>
                    <span className="flex items-center gap-1 rounded-full bg-[#F59E0B]/10 px-2 py-0.5 text-xs font-medium text-[#F59E0B]">
                      <Clock className="h-3 w-3" />
                      30 Min
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5568] mt-0.5">Upload proof of payment</p>
                </div>
              </label>
            </div>
          </div>

          {/* Insufficient balance warning */}
          {hasInsufficientBalance && (
            <div className="rounded-lg bg-[#EF4444]/10 px-4 py-3">
              <p className="text-sm text-[#EF4444]">
                Insufficient wallet balance. You need {formatCurrency(totalCents)} but only have{' '}
                {formatCurrency(walletBalanceCents)}.
              </p>
            </div>
          )}

          {/* Bank transfer proof upload */}
          {paymentMethod === 'bank_transfer' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Proof of Payment <span className="text-[#EF4444]">*</span>
              </label>
              <FileUpload onUpload={setProofUrl} />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="notes-input">
              Notes <span className="text-[#4A5568]">(optional)</span>
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20 resize-none"
            />
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
            disabled={!isValid || loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#2D7FF9] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2D7FF9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopUpRequestModal
