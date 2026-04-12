'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  /** The text value to copy to clipboard */
  value: string
  /** Accessible label for the button */
  label: string
}

/**
 * Button that copies a value to the clipboard.
 * Shows a brief "Copied!" confirmation after clicking.
 */
export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value)
      } else {
        // Fallback voor HTTP / niet-secure context (SSH via lokaal netwerk)
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-[#2A3040] text-[#94A3B8] hover:text-white"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-[#10B981]" />
          <span className="text-[#10B981]">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

export default CopyButton
