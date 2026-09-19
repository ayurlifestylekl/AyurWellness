'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Sparkles, ArrowRight, TrendingUp } from 'lucide-react'
import { signInWithPassword } from '@/actions/auth/signInWithPassword'

interface AgentLoginFormProps {
  resetSuccess?: boolean
  nextPath?: string
}

/**
 * Partner Hub sign-in.
 * Distinct from both /auth/login and /admin/login: gold-forward gradient,
 * editorial serif title, shimmer eyebrow, soft spotlight + live-stat tile.
 * Reads like a creator magazine cover.
 */
export default function AgentLoginForm({ resetSuccess, nextPath }: AgentLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await signInWithPassword(email, password)
      if (res.ok) {
        router.push(res.redirectTo ?? nextPath ?? '/agent/dashboard')
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-[32px] border border-[#B58A3B]/40 bg-gradient-to-b from-[#12372D] via-[#12372D] to-[#12372D]"
        style={{
          boxShadow:
            '0 30px 70px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(181, 138, 59,0.08), inset 0 1px 0 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Spotlight radial behind the title */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(55% 40% at 50% 0%, rgba(181, 138, 59,0.25), transparent 70%)',
          }}
        />
        {/* Subtle grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6' /></svg>\")",
          }}
        />

        <div className="relative p-8 sm:p-10">
          {/* Eyebrow — dark capsule with gold border, visible over the warm gradient top */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#B58A3B]/60 bg-[#12372D]/70 px-3.5 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-[#B58A3B]" />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FFF9F2]">
              Partner Hub
            </span>
          </div>

          {/* Editorial title using Playfair Display */}
          <h1
            className="font-display text-[38px] leading-[1.04] text-white sm:text-[44px]"
            style={{ letterSpacing: '-0.025em', fontWeight: 500 }}
          >
            Welcome back,
            <br />
            <em className="font-display not-italic text-[#B58A3B]">Creator.</em>
          </h1>

          <p
            className="mt-4 font-body text-[14px] text-white/65"
            style={{ lineHeight: 1.65 }}
          >
            Your share link, referred sales, and commission earnings — all inside.
          </p>

          {resetSuccess && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-400/40 bg-green-400/10 px-4 py-3.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
              <p className="font-body text-[12.5px] text-white/85">
                Password reset. Sign in with your new password.
              </p>
            </div>
          )}

          {/* Live-stat preview tile */}
          <div
            className="mt-6 flex items-center justify-between rounded-2xl border border-[#B58A3B]/30 bg-black/20 px-5 py-3.5 backdrop-blur-sm"
            style={{ boxShadow: 'inset 0 0 20px rgba(181, 138, 59,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B58A3B]/15">
                <TrendingUp className="h-4 w-4 text-[#B58A3B]" strokeWidth={2} />
              </span>
              <div>
                <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  This month
                </p>
                <p
                  className="font-display text-[22px] leading-none text-white"
                  style={{ letterSpacing: '-0.02em', fontWeight: 500 }}
                >
                  RM 0<span className="ml-1 font-body text-[12px] text-white/45">·</span>
                  <span className="ml-2 align-middle font-body text-[11.5px] text-white/55">earned</span>
                </p>
              </div>
            </div>
            <span className="font-body text-[10.5px] italic text-white/35">sign in to see</span>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <PremiumInput
              label="Partner email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={email.trim()}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="creator@example.com"
            />
            <PremiumInput
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="font-body text-[12px] italic text-white/55 underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-2xl border border-red-400/40 bg-red-400/10 px-4 py-3 font-body text-[12.5px] text-red-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="group relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#B58A3B] via-[#FFF9F2] to-[#B58A3B] px-7 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all duration-200 hover:from-[#B58A3B] hover:to-[#B58A3B] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12372D] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ boxShadow: '0 8px 24px -8px rgba(181, 138, 59,0.5)' }}
            >
              <span className="relative z-10">{isPending ? 'Signing in…' : 'Enter Partner Hub'}</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Below-card links */}
      <div className="mt-6 space-y-2 text-center">
        <p className="font-body text-[13px] text-white/55">
          Not a partner yet?{' '}
          <a
            href="https://wa.me/601163393436?text=Hi%2C%20I%27d%20like%20to%20apply%20to%20the%20Brand%20Partner%20program."
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#B58A3B] underline-offset-4 transition-colors hover:text-[#FFF9F2] hover:underline"
          >
            Apply via WhatsApp →
          </a>
        </p>
        <p className="font-body text-[11.5px] text-white/35">
          Looking for the customer sign-in?{' '}
          <Link
            href="/auth/login"
            className="underline-offset-4 transition-colors hover:text-white/65 hover:underline"
          >
            /auth/login
          </Link>
        </p>
      </div>
    </div>
  )
}

/**
 * Premium-flavoured input — soft surface, gold focus glow.
 */
function PremiumInput({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const inputId = `p-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
        {label}
      </span>
      <input
        id={inputId}
        className="block w-full rounded-2xl border border-white/15 bg-black/15 px-4 py-3 font-body text-[14.5px] text-white placeholder:text-white/35 transition-all duration-200 hover:border-[#B58A3B]/30 focus:border-[#B58A3B]/55 focus:bg-black/25 focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/20"
        {...rest}
      />
    </label>
  )
}
