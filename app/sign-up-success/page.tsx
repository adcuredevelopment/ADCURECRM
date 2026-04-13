import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
            <CheckCircle className="h-8 w-8 text-[#10B981]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Aanvraag ontvangen!
        </h1>

        {/* Description */}
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-2">
          Je aanvraag is succesvol ingediend. We hebben een bevestiging gestuurd naar je emailadres.
        </p>
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-8">
          Ons team beoordeelt je aanvraag binnen{' '}
          <span className="text-white font-medium">24 uur</span>. Je ontvangt een email zodra je aanvraag is goedgekeurd.
        </p>

        {/* Steps */}
        <div className="rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-5 mb-8 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5568] mb-4">Wat gebeurt er nu?</p>
          <div className="space-y-3">
            {[
              { step: '1', label: 'Je aanvraag wordt beoordeeld door ons team' },
              { step: '2', label: 'Je ontvangt een email met de uitkomst' },
              { step: '3', label: 'Bij goedkeuring kun je direct inloggen' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2D7FF9]/10 border border-[#2D7FF9]/20 text-[10px] font-bold text-[#2D7FF9]">
                  {step}
                </div>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <Link
          href="/login"
          className="text-sm text-[#2D7FF9] hover:underline"
        >
          Terug naar inloggen
        </Link>
      </div>
    </div>
  )
}
