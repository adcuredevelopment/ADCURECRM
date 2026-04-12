'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

interface ValidatedInputProps {
  id: string
  label: string
  placeholder?: string
  type?: string
  required?: boolean
  validateEndpoint: string
  validatePayloadKey: string
  onValidated?: (value: string, valid: boolean) => void
  hint?: string
  disabled?: boolean
}

/**
 * Input field with real-time server-side validation.
 * Shows status icons (spinner, check, cross) and feedback messages.
 * Validates on blur (when user leaves the field).
 */
export function ValidatedInput({
  id,
  label,
  placeholder,
  type = 'text',
  required,
  validateEndpoint,
  validatePayloadKey,
  onValidated,
  hint,
  disabled,
}: ValidatedInputProps) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<ValidationStatus>('idle')
  const [message, setMessage] = useState('')

  const validate = useCallback(async (val: string) => {
    if (!val.trim()) {
      setStatus('idle')
      setMessage('')
      return
    }

    setStatus('validating')
    setMessage('')

    try {
      const res = await fetch(validateEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [validatePayloadKey]: val }),
      })

      const data = await res.json()

      if (data.valid) {
        setStatus('valid')
        setMessage(
          data.companyName
            ? `✓ Geverifieerd: ${data.companyName}`
            : '✓ Geverifieerd'
        )
        onValidated?.(val, true)
      } else {
        setStatus('invalid')
        setMessage(data.error ?? 'Ongeldige waarde')
        onValidated?.(val, false)
      }
    } catch {
      setStatus('invalid')
      setMessage('Validatie tijdelijk niet beschikbaar')
      onValidated?.(val, false)
    }
  }, [validateEndpoint, validatePayloadKey, onValidated])

  const borderColor =
    status === 'valid'
      ? 'border-[#10B981] focus:border-[#10B981]'
      : status === 'invalid'
      ? 'border-[#EF4444] focus:border-[#EF4444]'
      : 'border-[#2A3040] focus:border-[#2D7FF9]'

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value)
            setStatus('idle')
            setMessage('')
          }}
          onBlur={() => validate(value)}
          className={`h-10 w-full rounded-lg border bg-[#141920] px-3 pr-10 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20 disabled:opacity-50 transition-colors ${borderColor}`}
        />

        {/* Status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === 'validating' && (
            <Loader2 className="h-4 w-4 animate-spin text-[#94A3B8]" />
          )}
          {status === 'valid' && (
            <CheckCircle className="h-4 w-4 text-[#10B981]" />
          )}
          {status === 'invalid' && (
            <XCircle className="h-4 w-4 text-[#EF4444]" />
          )}
        </div>
      </div>

      {/* Feedback message */}
      {message && (
        <p className={`mt-1.5 text-xs ${status === 'valid' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {message}
        </p>
      )}

      {/* Hint (shown when idle) */}
      {hint && status === 'idle' && (
        <p className="mt-1.5 text-xs text-[#4A5568]">{hint}</p>
      )}
    </div>
  )
}

export default ValidatedInput
