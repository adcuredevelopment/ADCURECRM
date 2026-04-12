'use client'

import { useEffect } from 'react'
import { X, Download, FileText } from 'lucide-react'

interface ProofViewerModalProps {
  isOpen: boolean
  onClose: () => void
  proofUrl: string
  title: string
}

/** Detect if a URL points to a PDF file */
function isPdfUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('.pdf') || lower.includes('application/pdf')
}

/**
 * ProofViewerModal displays a deposit proof file (image or PDF).
 * Images are shown as <img>, PDFs inside an <iframe>.
 * Includes close and download buttons.
 */
export function ProofViewerModal({
  isOpen,
  onClose,
  proofUrl,
  title,
}: ProofViewerModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isPdf = isPdfUrl(proofUrl)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-xl border border-[#2A3040] bg-[#1A1F2B] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A3040] px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#94A3B8]" />
            <h3 className="text-sm font-semibold text-white truncate max-w-sm">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={proofUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-[#2A3040] bg-[#141920] hover:border-[#3A4050] px-3 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="flex items-center justify-center h-7 w-7 rounded-lg text-[#4A5568] hover:text-white hover:bg-[#2A3040] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-[#0A0E14] p-4">
          {isPdf ? (
            <iframe
              src={proofUrl}
              title={title}
              className="w-full h-[600px] rounded-lg border border-[#2A3040]"
            />
          ) : (
            <img
              src={proofUrl}
              alt={title}
              className="max-w-full max-h-[600px] mx-auto rounded-lg object-contain"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement | null
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          )}
          {/* Fallback for broken images */}
          <div
            className="hidden flex-col items-center justify-center h-48 text-center"
          >
            <FileText className="h-10 w-10 text-[#4A5568] mb-3" />
            <p className="text-sm text-[#94A3B8]">Unable to preview this file</p>
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-[#2D7FF9] hover:underline"
            >
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProofViewerModal
