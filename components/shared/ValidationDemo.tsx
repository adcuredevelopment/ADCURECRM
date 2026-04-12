'use client'

import { ValidatedInput } from './ValidatedInput'

/**
 * Demo/showcase component for all validation types.
 * Can be embedded in any settings or profile page.
 */
export function ValidationDemo() {
  return (
    <div className="space-y-6 rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">Bedrijfsgegevens Validatie</h3>
        <p className="text-xs text-[#94A3B8]">
          Vul de velden in en verlaat het veld om te valideren.
        </p>
      </div>

      <ValidatedInput
        id="kvk"
        label="KVK Nummer"
        placeholder="12345678"
        validateEndpoint="/api/validate/kvk"
        validatePayloadKey="kvk"
        hint="8 cijfers, bijv. 12345678"
      />

      <ValidatedInput
        id="vat"
        label="BTW Nummer"
        placeholder="NL123456789B01"
        validateEndpoint="/api/validate/vat"
        validatePayloadKey="vat"
        hint="Format: NL + 9 cijfers + B + 2 cijfers"
      />

      <ValidatedInput
        id="iban"
        label="IBAN"
        placeholder="NL91ABNA0417164300"
        validateEndpoint="/api/validate/iban"
        validatePayloadKey="iban"
        hint="Internationaal bankrekeningnummer"
      />

      <ValidatedInput
        id="email"
        label="Zakelijk Email"
        type="email"
        placeholder="naam@bedrijf.nl"
        validateEndpoint="/api/validate/email"
        validatePayloadKey="email"
        hint="Geen Gmail, Hotmail, Outlook etc."
      />
    </div>
  )
}
