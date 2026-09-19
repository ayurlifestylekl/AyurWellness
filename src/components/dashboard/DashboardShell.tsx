'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Package,
  Calendar,
  User,
  ShoppingBag,
  ClipboardList,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Sun,
  Stethoscope,
  Gift,
  Inbox,
  Compass,
  Bell,
  MapPin,
  Heart,
  Boxes,
  Users,
  Store,
  Settings,
  Star,
  BarChart3,
  History,
  type LucideIcon,
} from 'lucide-react'
import { signOut } from '@/actions/auth/signOut'
import type { IconName, NavItem, PortalChrome } from '@/lib/dashboard/nav-types'
import NotificationsRealBell from '@/components/account/NotificationsRealBell'

/**
 * String-ID → Lucide component lookup. Lives in this client component
 * so the icons never have to cross the RSC boundary as function refs.
 * Add a new icon here AND in IconName when introducing a new nav item.
 */
const ICONS: Record<IconName, LucideIcon> = {
  'dashboard':       LayoutDashboard,
  'package':         Package,
  'calendar':        Calendar,
  'user':            User,
  'shopping-bag':    ShoppingBag,
  'clipboard-list':  ClipboardList,
  'sparkles':        Sparkles,
  'message-square':  MessageSquare,
  'trending-up':     TrendingUp,
  'sun':             Sun,
  'stethoscope':     Stethoscope,
  'gift':            Gift,
  'inbox':           Inbox,
  'compass':         Compass,
  'map-pin':         MapPin,
  'heart':           Heart,
  'bell':            Bell,
  'boxes':           Boxes,
  'users':           Users,
  'store':           Store,
  'settings':        Settings,
  'star':            Star,
  'bar-chart':       BarChart3,
  'history':         History,
}

interface DashboardShellProps {
  user: {
    id: string
    fullName: string
    email: string
    role: 'admin' | 'customer' | 'sales_agent'
    avatarUrl?: string | null
  }
  nav: NavItem[]
  portal: PortalChrome
  initialNotifications?: import('@/lib/notifications/queries').Notification[]
  children: React.ReactNode
}

export default function DashboardShell({ user, nav, portal, initialNotifications, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen bg-[#EDF4E7] text-[#12372D]">
      {/* ── Sidebar (desktop fixed + mobile drawer) ─────────────────── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col',
          'border-r border-black/20 bg-gradient-to-b from-[#006B3C] to-[#12372D] text-white',
          'transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
      >
        {/* Gold hairline along the right edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(181,138,59,0.45), transparent)' }}
        />
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
          <Link href="/" className="group flex items-center gap-2.5">
            <Image
              src="/kerala-logo.png"
              alt="Ayurvedic Wellness Centre"
              width={714}
              height={391}
              className="h-9 w-auto rounded-md bg-white p-1"
            />
            <span className="flex flex-col">
              <span className="font-heading text-[9.5px] font-bold uppercase tracking-[0.22em] leading-tight text-[#B58A3B]">
                {portal.label}
              </span>
            </span>
          </Link>
          {/* Mobile close */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/8 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = ICONS[item.icon]
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={[
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200',
                      active
                        ? 'bg-[#B58A3B]/[0.14] text-white'
                        : 'text-white/65 hover:bg-white/[0.04] hover:text-white',
                    ].join(' ')}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#B58A3B]" />
                    )}
                    <Icon
                      className={[
                        'h-4 w-4 shrink-0 transition-colors',
                        active ? 'text-[#B58A3B]' : 'text-white/55 group-hover:text-white/85',
                      ].join(' ')}
                      strokeWidth={1.8}
                    />
                    <span
                      className={[
                        'font-heading text-[13px] font-semibold tracking-[-0.005em]',
                        active ? 'text-white' : '',
                      ].join(' ')}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer mark */}
        <div className="border-t border-white/8 px-5 py-3 text-center">
          <span className="font-heading text-[9px] font-semibold uppercase tracking-[0.32em] text-white/30">
            Brickfields KL
          </span>
        </div>
      </aside>

      {/* Drawer overlay (mobile) */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── Right column ───────────────────────────────────────────────── */}
      <div className="lg:pl-[268px]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#006B3C]/10 bg-[#EDF4E7]/85 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#006B3C]/70 transition-colors hover:bg-[#006B3C]/[0.06] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
              {portal.shortName}
            </span>
          </div>

          {/* Right cluster: notifications + user menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <NotificationsRealBell userId={user.id} initial={initialNotifications ?? []} />
            <UserMenu user={user} />
          </div>
        </header>

        {/* Main content */}
        <main className="px-4 pb-8 pt-4 sm:px-6 sm:pb-8 lg:px-10 lg:pt-6">{children}</main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
function UserMenu({
  user,
}: {
  user: { fullName: string; email: string; role: 'admin' | 'customer' | 'sales_agent'; avatarUrl?: string | null }
}) {
  const [open, setOpen] = useState(false)
  const firstName = user.fullName.split(' ')[0] || 'You'
  const initial = firstName.charAt(0).toUpperCase()
  const roleLabel =
    user.role === 'admin' ? 'Admin' : user.role === 'sales_agent' ? 'Brand Partner' : 'Member'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2.5 rounded-full border border-[#006B3C]/8 bg-white px-2.5 py-1.5 transition-all hover:border-[#006B3C]/20 hover:shadow-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006B3C] font-heading text-[12px] font-bold text-[#B58A3B]">
            {initial}
          </span>
        )}
        <span className="hidden text-left sm:block">
          <span className="block font-heading text-[12px] font-semibold leading-tight text-[#006B3C]">
            {firstName}
          </span>
          <span className="block font-body text-[10px] leading-tight text-[#006B3C]/55">
            {roleLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#006B3C]/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white shadow-2xl shadow-black/8">
            <div className="border-b border-[#006B3C]/6 px-4 py-3">
              <p className="font-heading text-[13px] font-semibold text-[#006B3C]">
                {user.fullName || 'Welcome'}
              </p>
              <p className="mt-0.5 truncate font-body text-[11.5px] text-[#006B3C]/55">
                {user.email}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left font-heading text-[13px] font-semibold text-[#006B3C] transition-colors hover:bg-[#006B3C]/[0.04]"
              >
                <LogOut className="h-4 w-4 text-[#006B3C]/55" strokeWidth={1.8} />
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
