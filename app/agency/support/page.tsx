import { MessageSquare } from 'lucide-react'

export default function AgencySupportPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center">
      <MessageSquare className="h-10 w-10 text-[#4A5568] mb-4" />
      <h2 className="text-lg font-semibold text-white mb-2">Support</h2>
      <p className="text-[#94A3B8] text-sm max-w-sm">
        Support ticket management coming in Phase 3.
      </p>
    </div>
  )
}
