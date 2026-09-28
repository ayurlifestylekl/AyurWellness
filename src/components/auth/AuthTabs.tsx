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
      className="mb-7 grid grid-cols-2 gap-1 rounded-xl bg-[#F1F2EC] p-1"
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
        'flex h-10 items-center justify-center rounded-lg font-heading text-[12.5px] font-semibold tracking-[-0.005em] transition-all duration-200',
        active
          ? 'bg-white text-[#12372D] shadow-[0_2px_8px_-2px_rgba(18,55,45,0.18)]'
          : 'text-[#12372D]/50 hover:text-[#12372D]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
