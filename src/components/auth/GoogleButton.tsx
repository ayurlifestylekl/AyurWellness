'use client'

import { useTransition } from 'react'
import { signInWithGoogle } from '@/actions/auth/signInWithGoogle'

/**
 * Official Google "Sign in / Continue with Google" button.
 * On click, calls the signInWithGoogle server action, then redirects
 * the browser to the URL Supabase returned (the Google consent screen).
 */
export default function GoogleButton({
  label = 'Continue with Google',
  nextPath,
  onError,
}: {
  label?: string
  nextPath?: string
  onError?: (msg: string) => void
}) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const res = await signInWithGoogle(nextPath)
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
      <GoogleSvg className="h-5 w-5 shrink-0" />
      <span>{isPending ? 'Opening Google…' : label}</span>
    </button>
  )
}

function GoogleSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M21.8 10.2H12v3.9h5.6c-.5 2.6-2.7 4-5.6 4-3.4 0-6.1-2.8-6.1-6.1S8.6 5.9 12 5.9c1.5 0 2.9.5 4 1.4l2.9-2.9C17.1 2.8 14.7 1.8 12 1.8 6.5 1.8 2 6.3 2 12s4.5 10.2 10 10.2c5.8 0 9.9-4.1 9.9-9.9 0-.7-.1-1.4-.1-2.1z"
      />
      <path
        fill="#FF3D00"
        d="M3.2 7.3l3.3 2.4C7.4 7.5 9.5 5.9 12 5.9c1.5 0 2.9.5 4 1.4l2.9-2.9C17.1 2.8 14.7 1.8 12 1.8 8.1 1.8 4.7 4 3.2 7.3z"
      />
      <path
        fill="#4CAF50"
        d="M12 22.2c2.6 0 5-.9 6.8-2.5l-3.1-2.6c-1 .7-2.3 1.1-3.7 1.1-2.8 0-5.2-1.9-6-4.5l-3.3 2.5c1.4 3.4 4.7 6 8.3 6z"
      />
      <path
        fill="#1976D2"
        d="M21.8 10.2H12v3.9h5.6c-.3 1.3-1 2.4-2 3.2l3.1 2.6c1.8-1.7 3.1-4.2 3.1-7.6 0-.7-.1-1.4-.1-2.1z"
      />
    </svg>
  )
}
