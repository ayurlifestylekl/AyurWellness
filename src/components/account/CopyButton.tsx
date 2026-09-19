'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  /** The text to copy to clipboard */
  value: string
  /** Optional label shown next to the icon. Defaults to "Copy". */
  label?: string
  /** Style variant — small chip or wider button. */
  variant?: 'chip' | 'button'
}

export default function CopyButton({
  value,
  label = 'Copy',
  variant = 'chip',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API can fail in some browsers/contexts — silent fail is OK
    }
  }, [value])

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={copied ? 'Copied!' : `Copy ${value}`}
        className="inline-flex items-center gap-2 rounded-full border border-[#006B3C]/15 bg-white px-3.5 py-1.5 font-heading text-[11.5px] font-semibold text-[#006B3C]/75 transition-all hover:border-[#B58A3B]/45 hover:text-[#006B3C]"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-green-600" strokeWidth={2.5} />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" strokeWidth={2} />
            <span>{label}</span>
          </>
        )}
      </button>
    )
  }

  // Chip variant — minimal, icon + short label
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? 'Copied!' : `Copy ${value}`}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#006B3C]/55 transition-colors hover:bg-[#006B3C]/[0.06] hover:text-[#006B3C]"
    >
      {copied ? (
        <>
          <Check className="h-2.5 w-2.5 text-green-600" strokeWidth={2.5} />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-2.5 w-2.5" strokeWidth={2} />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}
