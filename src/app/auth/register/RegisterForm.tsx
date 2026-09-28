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
            className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#12372D] px-7 font-heading text-[12.5px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_36px_-18px_rgba(18,55,45,0.65)] transition-all hover:bg-[#0E2C24] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Message us on WhatsApp
          </a>
          <Link
            href="/auth/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#12372D]/12 bg-white px-7 font-heading text-[13px] font-semibold text-[#12372D] transition-colors hover:border-[#12372D]/25 hover:bg-[#FAFAF7]"
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
            className="font-semibold text-[#006B3C] underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {/* Invite badge */}
      {isInviteMode && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#B58A3B]/25 bg-[#FBF6EC] px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B58A3B]" />
          <p className="font-body text-[12.5px] leading-relaxed text-[#12372D]/75">
            Your invite is tied to <span className="font-semibold text-[#12372D]">{invite!.email}</span>. Commission terms are locked in from your admin — you don&apos;t need to enter them.
          </p>
        </div>
      )}

      {/* Google button — only for customer flow */}
      {!isInviteMode && (
        <>
          <GoogleButton nextPath={nextPath} onError={setError} label="Sign up with Google" tone="light" />
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#12372D]/10" />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.32em] text-[#12372D]/45">
              or
            </span>
            <span className="h-px flex-1 bg-[#12372D]/10" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!isInviteMode && (
          <>
            <AuthInput
            tone="light"
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
            tone="light"
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
            tone="light"
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
            tone="light"
            label="Email"
            type="email"
            value={invite!.email}
            readOnly
            disabled
            hint="Locked to your invite. Sign in with this email after you're set up."
          />
        )}

        <AuthInput
            tone="light"
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
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-[12.5px] text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#12372D] px-7 font-heading text-[12.5px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_36px_-18px_rgba(18,55,45,0.65)] transition-all hover:bg-[#0E2C24] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Creating account…' : isInviteMode ? 'Accept invite' : 'Create account'}
        </button>

        <p className="pt-1 font-body text-[11px] leading-relaxed text-[#12372D]/45">
          By continuing you agree to our terms of service. We protect your data per our privacy policy.
        </p>
      </form>
    </AuthCard>
  )
}
