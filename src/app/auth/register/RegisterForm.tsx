'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import GoogleButton from '@/components/auth/GoogleButton'
import { signUpCustomer } from '@/actions/auth/signUpCustomer'
import { signUpFromInvite } from '@/actions/auth/signUpFromInvite'

interface InvitePrefill {
  token: string
  email: string
  fullName: string
}

interface RegisterFormProps {
  invite: InvitePrefill | null
  /** Raw token from the URL — set even if invite lookup returned null (expired/invalid). */
  inviteTokenRaw?: string
  nextPath?: string
}

export default function RegisterForm({ invite, inviteTokenRaw, nextPath }: RegisterFormProps) {
  const router = useRouter()
  const isInviteMode = !!invite
  const isInviteInvalid = !!inviteTokenRaw && !invite

  const [email, setEmail] = useState(invite?.email ?? '')
  const [fullName, setFullName] = useState(invite?.fullName ?? '')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = isInviteMode
        ? await signUpFromInvite(invite!.token, password)
        : await signUpCustomer({ email, password, fullName, phone })
      if (!res.ok) {
        setError(res.error)
        return
      }
      // signUpFromInvite always returns redirectTo; signUpCustomer may return
      // either { redirectTo } (confirmation off) or { email, needsVerification }
      // (confirmation on). Customer path is dead from this form — page.tsx
      // redirects non-invite signups elsewhere — but we handle it defensively.
      const target =
        'redirectTo' in res ? res.redirectTo : '/auth/login?tab=signup'
      router.push(target ?? nextPath ?? '/account/dashboard')
    })
  }

  // Invalid-invite screen
  if (isInviteInvalid) {
    return (
      <AuthCard
        eyebrow="Brand Partner Invite"
        title="This invite is no longer valid."
        subtitle="The link may have expired (invites last 14 days) or already been used. Reach out to the team and we'll send you a fresh one."
      >
        <div className="flex flex-col gap-3">
          <a
            href="https://wa.me/601163393436?text=Hi%2C%20my%20Brand%20Partner%20invite%20link%20isn%27t%20working."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#B58A3B] px-7 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98]"
          >
            Message us on WhatsApp
          </a>
          <Link
            href="/auth/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-7 font-heading text-sm font-semibold text-white/85 transition-colors hover:border-white/35 hover:bg-white/[0.08]"
          >
            I already have an account
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow={isInviteMode ? 'Brand Partner Invite' : undefined}
      title={isInviteMode ? `Welcome, ${invite!.fullName.split(' ')[0]}.` : 'Create your account.'}
      subtitle={
        isInviteMode
          ? "You've been invited to join our Brand Partner program. Just pick a password to finish setting up your partner dashboard."
          : 'Track orders, manage consultations, and access exclusive offers.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={nextPath ? `/auth/login?next=${encodeURIComponent(nextPath)}` : '/auth/login'}
            className="font-semibold text-[#B58A3B] underline-offset-4 transition-colors hover:text-[#FFF9F2] hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {/* Invite badge */}
      {isInviteMode && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#B58A3B]/35 bg-[#B58A3B]/10 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B58A3B]" />
          <p className="font-body text-[12.5px] leading-relaxed text-white/80">
            Your invite is tied to <span className="font-semibold text-white">{invite!.email}</span>. Commission terms are locked in from your admin — you don&apos;t need to enter them.
          </p>
        </div>
      )}

      {/* Google button — only for customer flow */}
      {!isInviteMode && (
        <>
          <GoogleButton nextPath={nextPath} onError={setError} label="Sign up with Google" />
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">
              or
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!isInviteMode && (
          <>
            <AuthInput
              label="Full name"
              type="text"
              name="fullName"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Priya Nair"
            />
            <AuthInput
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <AuthInput
              label="Phone (Malaysia)"
              type="tel"
              name="phone"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+60 12 345 6789"
              hint="We'll only use this for order updates and WhatsApp."
            />
          </>
        )}

        {isInviteMode && (
          <AuthInput
            label="Email"
            type="email"
            value={invite!.email}
            readOnly
            disabled
            hint="Locked to your invite. Sign in with this email after you're set up."
          />
        )}

        <AuthInput
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          hint="Use 8+ characters. A mix of letters and numbers is safer."
        />

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
          className="group relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#B58A3B] px-7 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all duration-200 hover:bg-[#B58A3B] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12372D] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Creating account…' : isInviteMode ? 'Accept invite' : 'Create account'}
        </button>

        <p className="pt-1 font-body text-[11px] leading-relaxed text-white/40">
          By continuing you agree to our terms of service. We protect your data per our privacy policy.
        </p>
      </form>
    </AuthCard>
  )
}
