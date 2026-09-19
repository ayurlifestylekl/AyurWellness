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
            className="rounded-2xl border border-red-400/40 bg-red-400/10 px-4 py-3 font-body text-[12.5px] text-red-200"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#B58A3B] px-7 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </AuthCard>
  )
}
