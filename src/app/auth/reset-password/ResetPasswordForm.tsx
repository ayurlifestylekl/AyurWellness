'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import { resetPassword } from '@/actions/auth/resetPassword'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    startTransition(async () => {
      const res = await resetPassword(password)
      if (res.ok) {
        router.push(res.redirectTo ?? '/auth/login?reset=success')
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <AuthCard
      title="Set a new password."
      subtitle="Pick something you'll remember. Once saved, you'll be signed back in."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthInput
            tone="light"
          label="New password"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        <AuthInput
            tone="light"
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type it again"
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
          {isPending ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </AuthCard>
  )
}
