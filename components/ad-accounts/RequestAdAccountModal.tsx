'use client'

import { useState } from 'react'
import { X, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'

interface RequestAdAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CURRENCIES = ['EUR', 'USD', 'GBP']

const TIMEZONES = [
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
]

const PLATFORMS = [
  { value: 'meta', label: 'Meta (Facebook / Instagram)' },
  { value: 'google', label: 'Google Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
]

interface FormState {
  account_name: string
  domain_name: string
  business_manager_id: string
  currency: string
  timezone: string
  platform: string
}

const INITIAL_FORM: FormState = {
  account_name: '',
  domain_name: '',
  business_manager_id: '',
  currency: 'EUR',
  timezone: 'Europe/Amsterdam',
  platform: 'meta',
}

/**
 * Modal for submitting a new ad account request.
 * Shows a review-time info banner and validates required fields before submission.
 */
export function RequestAdAccountModal({ isOpen, onClose, onSuccess }: RequestAdAccountModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isValid =
    form.account_name.trim() &&
    form.domain_name.trim() &&
    form.business_manager_id.trim() &&
    form.platform

  const handleSubmit = async () => {
    if (!isValid) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ad-account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: form.account_name.trim(),
          domain_name: form.domain_name.trim(),
          business_manager_id: form.business_manager_id.trim(),
          currency: form.currency,
          timezone: form.timezone,
          platform: form.platform,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Failed to submit request')
        return
      }

      toast.success('Ad account request submitted! Review takes approximately 1 hour.')
      onSuccess()
      handleClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setError(null)
    onClose()
  }

  const inputClass =
    'h-10 w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20'
  const selectClass = inputClass

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-[#2A3040] bg-[#1A1F2B] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A3040] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Request Ad Account</h2>
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
          {/* Info banner */}
          <div className="flex gap-3 rounded-lg border border-[#2D7FF9]/20 bg-[#2D7FF9]/10 px-4 py-3">
            <Info className="h-4 w-4 shrink-0 text-[#2D7FF9] mt-0.5" />
            <p className="text-sm text-[#94A3B8]">
              Account reviews typically take{' '}
              <span className="font-medium text-white">approximately 1 hour</span>. You will be
              notified once your account is approved.
            </p>
          </div>

          {/* Ad Account Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="account-name">
              Ad Account Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              id="account-name"
              type="text"
              value={form.account_name}
              onChange={(e) => updateField('account_name', e.target.value)}
              placeholder="My Business Ad Account"
              className={inputClass}
            />
          </div>

          {/* Domain Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="domain-name">
              Domain Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              id="domain-name"
              type="text"
              value={form.domain_name}
              onChange={(e) => updateField('domain_name', e.target.value)}
              placeholder="example.com"
              className={inputClass}
            />
          </div>

          {/* Business Manager ID */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="bm-id">
              Business Manager ID <span className="text-[#EF4444]">*</span>
            </label>
            <input
              id="bm-id"
              type="text"
              value={form.business_manager_id}
              onChange={(e) => updateField('business_manager_id', e.target.value)}
              placeholder="123456789012345"
              className={inputClass}
            />
          </div>

          {/* Platform */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="platform">
              Platform <span className="text-[#EF4444]">*</span>
            </label>
            <select
              id="platform"
              value={form.platform}
              onChange={(e) => updateField('platform', e.target.value)}
              className={selectClass}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="currency">
              Currency
            </label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              className={selectClass}
            >
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="timezone">
              Timezone
            </label>
            <select
              id="timezone"
              value={form.timezone}
              onChange={(e) => updateField('timezone', e.target.value)}
              className={selectClass}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
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

export default RequestAdAccountModal
