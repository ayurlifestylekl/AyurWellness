'use client'

import { useTransition } from 'react'
import { signInWithApple } from '@/actions/auth/signInWithApple'

interface AppleButtonProps {
  label?: string
  nextPath?: string
  onError?: (msg: string) => void
}

/**
 * "Continue with Apple" button. Mirror of GoogleButton.
 * Render only when NEXT_PUBLIC_APPLE_AUTH_ENABLED=true so we don't show
 * a broken option when the Supabase Apple provider isn't configured.
 */
export default function AppleButton({
  label = 'Continue with Apple',
  nextPath,
  onError,
}: AppleButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const res = await signInWithApple(nextPath)
      if (res.ok) {
        window.location.assign(res.url)
      } else {
        onError?.(res.error)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="group relative inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-5 font-heading text-[14px] font-semibold text-white transition-colors duration-200 hover:border-white/35 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12372D] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <AppleSvg className="h-5 w-5 shrink-0" />
      <span>{isPending ? 'Opening Apple…' : label}</span>
    </button>
  )
}

function AppleSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.05 12.04c-.03-2.81 2.3-4.16 2.4-4.23-1.31-1.91-3.35-2.17-4.07-2.2-1.73-.18-3.39 1.02-4.27 1.02-.88 0-2.24-1-3.69-.97-1.89.03-3.65 1.1-4.62 2.79-1.98 3.42-.5 8.48 1.42 11.27.94 1.36 2.05 2.89 3.5 2.84 1.42-.06 1.95-.91 3.66-.91s2.2.91 3.69.88c1.52-.03 2.49-1.39 3.42-2.76 1.08-1.58 1.52-3.11 1.55-3.19-.03-.01-2.97-1.14-3-4.54zM14.16 4.06c.78-.94 1.31-2.25 1.17-3.56-1.13.05-2.5.75-3.31 1.69-.72.83-1.36 2.17-1.19 3.45 1.26.1 2.55-.64 3.33-1.58z" />
    </svg>
  )
}
