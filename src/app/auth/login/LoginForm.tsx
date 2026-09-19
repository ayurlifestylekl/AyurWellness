'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import AuthInput from '@/components/auth/AuthInput'
import AuthTabs, { type AuthTab } from '@/components/auth/AuthTabs'
import GoogleButton from '@/components/auth/GoogleButton'
import AppleButton from '@/components/auth/AppleButton'
import EmailOtpStep from '@/components/auth/EmailOtpStep'
import { requestSignInOtp } from '@/actions/auth/requestSignInOtp'
import { verifySignInOtp } from '@/actions/auth/verifySignInOtp'
import { verifySignUpOtp } from '@/actions/auth/verifySignUpOtp'
import { signUpCustomer } from '@/actions/auth/signUpCustomer'
import { signInDirect } from '@/actions/auth/signInDirect'

const APPLE_ENABLED = process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === 'true'
// Google defaults to ON — flip to "false" only if Supabase Google provider is not configured.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== 'false'

/**
 * OTP requirement flag with hard production guard.
 *
 * In production builds (NODE_ENV='production'), this is ALWAYS true — the
 * email-OTP second factor cannot be disabled even if someone sets the
 * NEXT_PUBLIC_REQUIRE_OTP env var on Vercel. This is by design: the flag
 * is dev-only, enforced at compile time, not just documented.
 *
 * Set NEXT_PUBLIC_REQUIRE_OTP=false to skip the email-OTP step
 * (avoids Supabase free-tier email rate limits during demo / dev /
 * iterative testing). When unset, defaults to ON for safety.
 *
 * For sign-up to also skip the email-confirmation link, you must
 * additionally toggle OFF "Confirm email" in Supabase Dashboard →
 * Authentication → Providers → Email.
 *
 * ⚠ Turn this back ON for real launch — without OTP, anyone who
 * guesses or phishes a password gets full account access.
 */
const OTP_REQUIRED = process.env.NEXT_PUBLIC_REQUIRE_OTP !== 'false'

interface LoginFormProps {
  initialTab: AuthTab
  resetSuccess?: boolean
  nextPath?: string
}

export default function LoginForm({
  initialTab,
  resetSuccess,
  nextPath,
}: LoginFormProps) {
  const searchParams = useSearchParams()
  const urlTab: AuthTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin'
  const [tab, setTab] = useState<AuthTab>(initialTab)
  useEffect(() => setTab(urlTab), [urlTab])

  return (
    <div className="w-full">
      <AuthTabs active={tab} />

      <h1
        className="font-heading text-[24px] font-bold leading-tight text-white"
        style={{ letterSpacing: '-0.02em' }}
      >
        {tab === 'signin' ? 'Welcome back.' : 'Create your account.'}
      </h1>
      <p className="mt-1.5 font-body text-[12.5px] leading-relaxed text-white/55">
        {tab === 'signin'
          ? 'Track orders, manage consultations.'
          : 'Join the wellness program.'}
      </p>

      {resetSuccess && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-green-400/40 bg-green-400/10 px-3 py-2.5">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-300" />
          <p className="font-body text-[11.5px] leading-relaxed text-white/85">
            Password reset. Sign in with your new password.
          </p>
        </div>
      )}

      <div className="mt-5">
        {tab === 'signin' ? (
          <SignInPane nextPath={nextPath} />
        ) : (
          <SignUpPane nextPath={nextPath} />
        )}
      </div>

      <div className="mt-5 text-center font-body text-[12.5px] text-white/55">
        {tab === 'signin' ? (
          <>
            New to Ayurvedic Wellness Centre?{' '}
            <button
              type="button"
              onClick={() => {
                window.history.pushState(null, '', '?tab=signup')
                setTab('signup')
              }}
              className="font-semibold text-[#B58A3B] underline-offset-4 transition-colors hover:text-[#FFF9F2] hover:underline"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                window.history.pushState(null, '', '?')
                setTab('signin')
              }}
              className="font-semibold text-[#B58A3B] underline-offset-4 transition-colors hover:text-[#FFF9F2] hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Sign In pane — 2 steps: credentials → email OTP
// ─────────────────────────────────────────────────────────────────────
function SignInPane({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submitCredentials = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      if (OTP_REQUIRED) {
        // Production / OTP-on: validate password, send code, pivot to OTP step
        const res = await requestSignInOtp(identifier, password)
        if (res.ok) {
          setOtpEmail(res.email)
          setStep('otp')
        } else {
          setError(res.error)
        }
      } else {
        // Dev-mode OTP bypass: validate password, keep session, go straight to dashboard
        const res = await signInDirect(identifier, password)
        if (res.ok) {
          router.push(res.redirectTo ?? nextPath ?? '/account/dashboard')
        } else {
          setError(res.error)
        }
      }
    })
  }

  if (step === 'otp') {
    return (
      <EmailOtpStep
        email={otpEmail}
        title="Confirm sign-in"
        onVerify={(code) => verifySignInOtp(otpEmail, code)}
        onSuccess={(redirectTo) =>
          router.push(redirectTo ?? nextPath ?? '/account/dashboard')
        }
        onBack={() => {
          setStep('credentials')
          setError(null)
        }}
        submitLabel="Verify & sign in"
      />
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitCredentials} className="space-y-3" noValidate>
        <AuthInput
          label="Email or phone"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={identifier.trim()}
          onChange={(e) => setIdentifier(e.target.value.trim())}
          placeholder="you@example.com  or  +60 12 345 6789"
        />
        <AuthInput
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
            className="font-body text-[11.5px] text-white/55 underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        {error && <ErrorBox text={error} />}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#B58A3B] px-7 font-heading text-[13px] font-bold uppercase tracking-wider text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Sending code…' : 'Continue'}
        </button>
      </form>

      {(GOOGLE_ENABLED || APPLE_ENABLED) && (
        <>
          <OrDivider />
          <OAuthRow nextPath={nextPath} onError={setError} />
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Sign Up pane — 2 steps: form → email OTP
// ─────────────────────────────────────────────────────────────────────
function SignUpPane({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await signUpCustomer({ email, password, fullName, phone })
      if (!res.ok) {
        setError(res.error)
        return
      }
      if ('email' in res) {
        // Email confirmation required — pivot to OTP step
        setOtpEmail(res.email)
        setStep('otp')
      } else {
        // Email confirmation disabled in Supabase — signed in immediately
        router.push(res.redirectTo ?? nextPath ?? '/account/dashboard')
      }
    })
  }

  if (step === 'otp') {
    return (
      <EmailOtpStep
        email={otpEmail}
        title="Confirm your email"
        onVerify={(code) => verifySignUpOtp(otpEmail, code)}
        onSuccess={(redirectTo) =>
          router.push(redirectTo ?? nextPath ?? '/account/dashboard')
        }
        onBack={() => {
          setStep('form')
          setError(null)
        }}
        submitLabel="Verify & create account"
      />
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitForm} className="space-y-3" noValidate>
        <AuthInput
          label="Full name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Priya Nair"
        />
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <AuthInput
          label="Phone (Malaysia)"
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+60 12 345 6789"
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        {error && <ErrorBox text={error} />}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#B58A3B] px-7 font-heading text-[13px] font-bold uppercase tracking-wider text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {(GOOGLE_ENABLED || APPLE_ENABLED) && (
        <>
          <OrDivider />
          <OAuthRow nextPath={nextPath} onError={setError} />
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
        or
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  )
}

function OAuthRow({
  nextPath,
  onError,
}: {
  nextPath?: string
  onError: (m: string) => void
}) {
  const bothEnabled = GOOGLE_ENABLED && APPLE_ENABLED
  return (
    <div className={bothEnabled ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
      {GOOGLE_ENABLED && (
        <GoogleButton
          nextPath={nextPath}
          onError={onError}
          label={bothEnabled ? 'Google' : 'Continue with Google'}
        />
      )}
      {APPLE_ENABLED && (
        <AppleButton
          nextPath={nextPath}
          onError={onError}
          label={bothEnabled ? 'Apple' : 'Continue with Apple'}
        />
      )}
    </div>
  )
}

function ErrorBox({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 font-body text-[11.5px] text-red-200"
    >
      {text}
    </p>
  )
}
