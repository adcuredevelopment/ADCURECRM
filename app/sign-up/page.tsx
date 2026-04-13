'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react'

// =====================================================
// Types
// =====================================================

interface FormState {
  company_name: string
  kvk_number: string
  vat_number: string
  iban: string
  full_name: string
  email: string
  phone: string
}

interface FieldValidation {
  status: 'idle' | 'validating' | 'valid' | 'invalid'
  message: string
}

type FieldValidations = Partial<Record<keyof FormState, FieldValidation>>

const INITIAL_FORM: FormState = {
  company_name: '',
  kvk_number: '',
  vat_number: '',
  iban: '',
  full_name: '',
  email: '',
  phone: '',
}

// =====================================================
// Inline validation helpers (client-side fast checks)
// =====================================================

function validateKVKFormat(val: string): string | null {
  if (!val) return null
  if (!/^\d{8}$/.test(val.trim())) return 'KVK nummer moet exact 8 cijfers zijn'
  return null
}

function validateVATFormat(val: string): string | null {
  if (!val) return null
  if (!/^NL\d{9}B\d{2}$/i.test(val.trim())) return 'Format: NL123456789B01'
  return null
}

function validateIBANFormat(val: string): string | null {
  if (!val) return null // IBAN is optional
  const cleaned = val.replace(/\s/g, '').toUpperCase()
  // Accepts all international IBANs: 2 letters + 2 digits + up to 30 alphanumeric
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(cleaned)) return 'Ongeldig IBAN (bijv. NL91ABNA0417164300)'
  return null
}

function validatePhoneFormat(val: string): string | null {
  if (!val) return null
  // Accepts international (+31, +32, +44 etc) and local Dutch formats
  const cleaned = val.replace(/[\s\-().]/g, '')
  if (!/^(\+\d{7,15}|0\d{8,9})$/.test(cleaned)) return 'Ongeldig telefoonnummer (bijv. +31612345678 of 0612345678)'
  return null
}

function validateEmailFormat(val: string): string | null {
  if (!val) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Ongeldig email formaat'
  return null
}

// =====================================================
// Form Section Component
// =====================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A5568] mb-4 pt-2">
      {children}
    </h3>
  )
}

function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string | null
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-[#EF4444]">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-[#4A5568]">{hint}</p>}
    </div>
  )
}

// =====================================================
// Main Sign-Up Page
// =====================================================

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const inputClass = (field: keyof FormState) =>
    `h-10 w-full rounded-lg border bg-[#141920] px-3 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]/20 transition-colors ${
      errors[field]
        ? 'border-[#EF4444] focus:border-[#EF4444]'
        : 'border-[#2A3040] focus:border-[#2D7FF9]'
    }`

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validateField = (field: keyof FormState, value: string): string | null => {
    switch (field) {
      case 'kvk_number': return validateKVKFormat(value)
      case 'vat_number': return validateVATFormat(value)
      case 'iban': return validateIBANFormat(value)
      case 'phone': return validatePhoneFormat(value)
      case 'email': return validateEmailFormat(value)
      default: return null
    }
  }

  const handleBlur = (field: keyof FormState) => {
    const error = validateField(field, form[field])
    if (error) setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const validateAll = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {}

    // Required fields
    if (!form.company_name.trim()) newErrors.company_name = 'Bedrijfsnaam is verplicht'
    if (!form.kvk_number.trim()) newErrors.kvk_number = 'KVK nummer is verplicht'
    if (!form.vat_number.trim()) newErrors.vat_number = 'BTW nummer is verplicht'
    if (!form.full_name.trim()) newErrors.full_name = 'Naam is verplicht'
    if (!form.email.trim()) newErrors.email = 'Email is verplicht'
    if (!form.phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht'

    // Format checks
    const formatChecks: Array<keyof FormState> = ['kvk_number', 'vat_number', 'iban', 'phone', 'email']
    for (const field of formatChecks) {
      if (form[field] && !newErrors[field]) {
        const err = validateField(field, form[field])
        if (err) newErrors[field] = err
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    setLoading(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/account-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error ?? 'Er is iets misgegaan. Probeer het opnieuw.')
        return
      }

      router.push('/sign-up-success')
    } catch {
      setSubmitError('Er is iets misgegaan. Controleer je internetverbinding en probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E14] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2A3040] px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2D7FF9]">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">AdCure Agency</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-10">
        <div className="max-w-lg mx-auto">
          {/* Page title */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Account aanvragen</h1>
            <p className="text-sm text-[#94A3B8]">
              Vul je bedrijfsgegevens in. Ons team beoordeelt je aanvraag binnen 24 uur.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <div className="rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6 space-y-4">
              <SectionTitle>Bedrijfsgegevens</SectionTitle>

              <FormField id="company_name" label="Bedrijfsnaam" required error={errors.company_name}>
                <input
                  id="company_name"
                  type="text"
                  value={form.company_name}
                  onChange={(e) => update('company_name', e.target.value)}
                  onBlur={() => handleBlur('company_name')}
                  placeholder="Mijn Bedrijf BV"
                  className={inputClass('company_name')}
                />
              </FormField>

              <FormField
                id="kvk_number"
                label="KVK Nummer"
                required
                error={errors.kvk_number}
                hint="8 cijfers, bijv. 12345678"
              >
                <input
                  id="kvk_number"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={form.kvk_number}
                  onChange={(e) => update('kvk_number', e.target.value.replace(/\D/g, ''))}
                  onBlur={() => handleBlur('kvk_number')}
                  placeholder="12345678"
                  className={inputClass('kvk_number')}
                />
              </FormField>

              <FormField
                id="vat_number"
                label="BTW Nummer"
                required
                error={errors.vat_number}
                hint="Format: NL123456789B01"
              >
                <input
                  id="vat_number"
                  type="text"
                  value={form.vat_number}
                  onChange={(e) => update('vat_number', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('vat_number')}
                  placeholder="NL123456789B01"
                  className={inputClass('vat_number')}
                />
              </FormField>

              <FormField
                id="iban"
                label="IBAN"
                error={errors.iban}
                hint="Optioneel — bijv. NL91ABNA0417164300"
              >
                <input
                  id="iban"
                  type="text"
                  value={form.iban}
                  onChange={(e) => update('iban', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('iban')}
                  placeholder="NL91ABNA0417164300"
                  className={inputClass('iban')}
                />
              </FormField>
            </div>

            {/* Contact Info */}
            <div className="rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6 space-y-4">
              <SectionTitle>Contactgegevens</SectionTitle>

              <FormField id="full_name" label="Voor- en achternaam" required error={errors.full_name}>
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  onBlur={() => handleBlur('full_name')}
                  placeholder="Jan de Vries"
                  className={inputClass('full_name')}
                />
              </FormField>

              <FormField
                id="email"
                label="Email"
                required
                error={errors.email}
              >
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="naam@bedrijf.nl"
                  className={inputClass('email')}
                />
              </FormField>

              <FormField
                id="phone"
                label="Telefoonnummer"
                required
                error={errors.phone}
                hint="Format: +31612345678 of 0612345678"
              >
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  placeholder="+31612345678"
                  className={inputClass('phone')}
                />
              </FormField>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 px-4 py-3">
                <XCircle className="h-4 w-4 text-[#EF4444] mt-0.5 shrink-0" />
                <p className="text-sm text-[#EF4444]">{submitError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2D7FF9] hover:bg-[#2070e0] py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aanvraag indienen...
                </>
              ) : (
                'Account aanvragen'
              )}
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-[#4A5568]">
              Heb je al een account?{' '}
              <a href="/login" className="text-[#2D7FF9] hover:underline">
                Inloggen
              </a>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
