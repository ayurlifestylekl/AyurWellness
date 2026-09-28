'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  ChevronDown,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  User,
  type LucideIcon,
} from 'lucide-react'
import { signOut } from '@/actions/auth/signOut'
import NotificationsRealBell from '@/components/account/NotificationsRealBell'
import type { Notification } from '@/lib/notifications/queries'

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Home', href: '/account/dashboard', icon: Home },
  { label: 'My Visits', href: '/account/appointments', icon: CalendarDays },
  { label: 'My Dosha', href: '/account/assessments', icon: Compass },
  { label: 'Orders', href: '/account/product-orders', icon: Package },
  { label: 'Messages', href: '/account/messages', icon: MessageCircle },
]

const TABS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Home', href: '/account/dashboard', icon: Home },
  { label: 'Visits', href: '/account/appointments', icon: CalendarDays },
  { label: 'Messages', href: '/account/messages', icon: MessageCircle },
  { label: 'Me', href: '/account/profile', icon: User },
]

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/')

export default function CustomerShell({
  user,
  initialNotifications,
  children,
}: {
  user: { id: string; fullName: string; email: string; avatarUrl?: string | null }
  initialNotifications: Notification[]
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen bg-[#EFE9DC] text-[#12372D]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'radial-gradient(60% 40% at 100% 0%, rgba(181,138,59,0.18), transparent 70%), radial-gradient(50% 40% at 0% 100%, rgba(0,107,60,0.12), transparent 70%)',
        }}
      />

      <header className="sticky top-0 z-30 border-b border-[#E4C384]/15 bg-[#12372D] text-white shadow-[0_12px_30px_-20px_rgba(13,42,34,0.9)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Ayurvedic Wellness Centre — home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-[0_6px_16px_-8px_rgba(18,55,45,0.35)] transition-transform group-hover:scale-[1.04]">
              <Image src="/awc-icon.png" alt="" width={1090} height={890} className="h-7 w-auto" />
            </span>
            <span className="hidden font-heading text-[13px] font-bold leading-[1.15] text-white sm:block">
              Ayurvedic Wellness
              <br />
              Centre
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-1 lg:flex" aria-label="Account">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'inline-flex h-10 items-center gap-2 rounded-xl px-3.5 font-heading text-[12.5px] font-semibold transition-all',
                    active ? 'bg-[#F7F1E3] text-[#12372D] shadow-[0_8px_18px_-10px_rgba(0,0,0,0.6)]' : 'text-white/65 hover:bg-white/[0.08] hover:text-white',
                  ].join(' ')}
                >
                  <item.icon className={`h-4 w-4 ${active ? 'text-[#B58A3B]' : ''}`} strokeWidth={1.9} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/book"
              className="hidden h-10 items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#E4C384] to-[#B58A3B] px-4 font-heading text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#12372D] shadow-[0_10px_20px_-12px_rgba(181,138,59,0.9)] transition hover:brightness-105 sm:inline-flex"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              Book
            </Link>
            <NotificationsRealBell userId={user.id} initial={initialNotifications} />
            <ProfileMenu user={user} />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:pb-16">{children}</main>

      <nav
        aria-label="Account"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E4C384]/15 bg-[#12372D] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
          {TABS.slice(0, 2).map((t) => (
            <Tab key={t.href} {...t} active={isActive(pathname, t.href)} />
          ))}
          <Link href="/book" aria-label="Book a visit" className="mx-auto -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#E4C384] to-[#B58A3B] text-[#12372D] shadow-[0_12px_24px_-10px_rgba(181,138,59,0.9)] ring-4 ring-[#12372D]">
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </Link>
          {TABS.slice(2).map((t) => (
            <Tab key={t.href} {...t} active={isActive(pathname, t.href)} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function Tab({ label, href, icon: Icon, active }: { label: string; href: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex h-full flex-col items-center justify-center gap-1 font-heading text-[10.5px] font-semibold ${active ? 'text-white' : 'text-white/50'}`}
    >
      <span className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${active ? 'bg-white/10' : ''}`}>
        <Icon className={`h-[18px] w-[18px] ${active ? 'text-[#E4C384]' : ''}`} strokeWidth={1.9} />
      </span>
      {label}
    </Link>
  )
}

function ProfileMenu({ user }: { user: { fullName: string; email: string; avatarUrl?: string | null } }) {
  const [open, setOpen] = useState(false)
  const initial = (user.fullName.trim().charAt(0) || 'M').toUpperCase()
  const links = [
    ...NAV.slice(2),
    { label: 'Profile & health', href: '/account/profile', icon: User },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] pl-1 pr-2 transition hover:bg-white/[0.12]"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E4C384] to-[#B58A3B] font-heading text-[13px] font-bold text-[#12372D]">
            {initial}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default" />
          <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-[#12372D]/[0.08] bg-white shadow-[0_24px_48px_-20px_rgba(18,55,45,0.35)]">
            <div className="border-b border-[#12372D]/[0.06] px-4 py-3">
              <p className="truncate font-heading text-[13.5px] font-semibold text-[#12372D]">{user.fullName}</p>
              <p className="truncate font-body text-[12px] text-[#12372D]/50">{user.email}</p>
            </div>
            <div className="py-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 font-heading text-[13px] font-medium text-[#12372D]/80 hover:bg-[#F4EEE1] hover:text-[#12372D]"
                >
                  <l.icon className="h-4 w-4 text-[#B58A3B]" strokeWidth={1.9} />
                  {l.label}
                </Link>
              ))}
            </div>
            <form action={signOut} className="border-t border-[#12372D]/[0.06]">
              <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 font-heading text-[13px] font-semibold text-[#12372D]/70 hover:bg-red-50 hover:text-red-700">
                <LogOut className="h-4 w-4" strokeWidth={1.9} />
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
