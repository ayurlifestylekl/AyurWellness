'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, LogOut, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { signOut } from '@/actions/auth/signOut'

const todayLabel = () =>
  new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())

export function PortalFrame({
  portalLabel,
  homeHref,
  sidebarAction,
  nav,
  user,
  topbarRight,
  children,
}: {
  portalLabel: string
  homeHref: string
  sidebarAction?: React.ReactNode
  nav: React.ReactNode
  user: { name: string; email?: string; roleLabel: string; avatarUrl?: string | null }
  topbarRight?: React.ReactNode
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initial = (user.name.trim().charAt(0) || 'A').toUpperCase()

  return (
    <div className="relative min-h-screen bg-[#F5F4EE] text-[#12372D]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'radial-gradient(50% 40% at 100% 0%, rgba(181,138,59,0.08), transparent 70%), radial-gradient(40% 40% at 20% 100%, rgba(0,107,60,0.05), transparent 70%)',
        }}
      />

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col overflow-hidden text-white',
          'transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
        style={{ background: 'linear-gradient(180deg, #14402F 0%, #12372D 45%, #0D2A22 100%)' }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(181,138,59,0.22), transparent 70%)' }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(228,195,132,0.35), transparent)' }}
        />

        <div className="relative flex items-center justify-between px-5 pb-5 pt-6">
          <Link href={homeHref} className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.04]">
              <Image src="/awc-icon.png" alt="" width={1090} height={890} className="h-8 w-auto" />
            </span>
            <span className="flex flex-col">
              <span className="font-heading text-[14px] font-bold leading-[1.15] text-white">
                Ayurvedic Wellness
                <br />
                Centre
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mx-5 mb-2 flex items-center gap-2 rounded-lg border border-[#E4C384]/20 bg-[#E4C384]/[0.07] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E4C384]" />
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E4C384]">{portalLabel}</span>
        </div>

        <nav
          className="relative flex-1 overflow-y-auto px-3 pb-6 pt-3 [scrollbar-width:thin]"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) setDrawerOpen(false)
          }}
        >
          {sidebarAction && <div className="mb-4 px-1">{sidebarAction}</div>}
          {nav}
        </nav>

        <div className="relative border-t border-white/[0.08] p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E4C384] to-[#B58A3B] font-heading text-[13px] font-bold text-[#12372D]">
                {initial}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-heading text-[12.5px] font-semibold text-white">{user.name}</span>
              <span className="block truncate font-body text-[11px] text-white/45">{user.roleLabel}</span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-[#0D2A22]/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="relative lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-[#12372D]/[0.06] bg-[#F5F4EE]/80 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#12372D]/10 bg-white text-[#12372D]/70 transition-colors hover:text-[#12372D] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-[#12372D]/45">
              {portalLabel}
            </span>
            <span className="hidden h-4 w-px bg-[#12372D]/15 sm:block" />
            <span className="hidden font-body text-[13px] text-[#12372D]/60 sm:block" suppressHydrationWarning>
              {todayLabel()}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            {topbarRight}
            <Link
              href="/"
              className="hidden h-10 items-center gap-1.5 rounded-xl border border-[#12372D]/10 bg-white px-3.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#12372D]/70 transition-colors hover:border-[#B58A3B]/40 hover:text-[#12372D] sm:inline-flex"
            >
              View site
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <main className="px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-8">{children}</main>
      </div>
    </div>
  )
}

export function PortalNavSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      {title && (
        <p className="mb-2 px-3 font-heading text-[9.5px] font-semibold uppercase tracking-[0.26em] text-white/35">{title}</p>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </div>
  )
}

export function PortalNavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  badge?: number | null
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={[
          'group relative flex min-h-[42px] items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200',
          active
            ? 'bg-white text-[#12372D] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.55)]'
            : 'text-white/65 hover:bg-white/[0.06] hover:text-white',
        ].join(' ')}
      >
        <span
          className={[
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
            active ? 'bg-[#B58A3B]/15 text-[#B58A3B]' : 'text-white/55 group-hover:text-[#E4C384]',
          ].join(' ')}
        >
          <Icon className="h-[15px] w-[15px]" strokeWidth={1.9} />
        </span>
        <span className="flex-1 font-heading text-[13px] font-semibold tracking-[-0.005em]">{label}</span>
        {badge ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E4C384] px-1.5 font-heading text-[10px] font-bold text-[#12372D]">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
