'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Copies an email address, for visitors whose device has no mail app to open. */
export default function CopyEmailButton({ email, className = '' }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* the address is also shown as text, so it can be selected by hand */
    }
  }
  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? 'Copied' : 'Copy email address'}
    </button>
  )
}
