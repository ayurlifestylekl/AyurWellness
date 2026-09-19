'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CopyButton({
  value,
  label = 'Copy',
  className = '',
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for very old browsers
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/15 ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" strokeWidth={2.2} />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" strokeWidth={2.2} />
          {label}
        </>
      )}
    </button>
  )
}
