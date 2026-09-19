'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export type AuthTab = 'signin' | 'signup'

interface AuthTabsProps {
  active: AuthTab
}

/**
 * Tab navigator for /auth/login (Sign In | Create Account).
 * Source of truth is the URL ?tab= param so tabs are deep-linkable and
 * back-button friendly.
 */
export default function AuthTabs({ active }: AuthTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setTab = useCallback(
    (tab: AuthTab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'signin') params.delete('tab')
      else params.set('tab', tab)
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div
      role="tablist"
      aria-label="Sign in or create account"
      className="mb-7 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"
    >
      <TabButton label="Sign In" active={active === 'signin'} onClick={() => setTab('signin')} />
      <TabButton label="Create Account" active={active === 'signup'} onClick={() => setTab('signup')} />
    </div>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      type="button"
      onClick={onClick}
      className={[
        'flex h-10 items-center justify-center rounded-full font-heading text-[12.5px] font-semibold tracking-[-0.005em] transition-all duration-200',
        active
          ? 'bg-[#B58A3B] text-[#12372D] shadow-sm'
          : 'text-white/55 hover:text-white/85',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
