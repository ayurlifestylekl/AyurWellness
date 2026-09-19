'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, LayoutDashboard, CalendarDays, Users, Stethoscope, ClipboardList, type LucideIcon } from 'lucide-react'
import { signOut } from '@/actions/auth/signOut'
import { doctorNav } from '@/lib/booking/dashboard-nav'

// Icons are a rendering concern and stay local to the shell — dashboard-nav.ts
// stays plain data so it's trivially testable in Node. Keyed by label since
// doctorNav labels are unique.
const ICON_BY_LABEL: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  Schedule: ClipboardList,
  Calendar: CalendarDays,
  Patients: Users,
  Consultations: Stethoscope,
}

export default function DoctorShell({
  role,
  toClearCount = 0,
  children,
}: {
  role: string
  toClearCount?: number
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen bg-cream text-dark">
      {/* ── Sidebar (desktop fixed + mobile drawer) ─────────────────── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-gradient-to-b from-[#006B3C] to-[#12372D] text-white',
          'transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(181,138,59,0.45), transparent)' }}
        />
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <Link href="/doctor" className="flex flex-col">
            <span className="font-heading text-[15px] font-extrabold leading-tight text-white">
              Ayurvedic Wellness
            </span>
            <span className="font-heading text-[9.5px] font-bold uppercase tracking-[0.22em] text-gold">
              Doctor Portal
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <ul className="space-y-1">
            {doctorNav.map((item) => {
              // '/doctor' must match exactly — every other route is a prefix match.
              const active = item.href === '/doctor' ? pathname === item.href : pathname.startsWith(item.href)
              const Icon = ICON_BY_LABEL[item.label] ?? LayoutDashboard
              const badge =
                item.href === '/doctor/consultations' && toClearCount > 0
                  ? toClearCount
                  : null
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={[
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200',
                      active ? 'bg-gold/[0.16] text-white' : 'text-white/65 hover:bg-white/[0.05] hover:text-white',
                    ].join(' ')}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold" />}
                    <Icon
                      className={['h-4 w-4 shrink-0 transition-colors', active ? 'text-gold' : 'text-white/55 group-hover:text-white/85'].join(' ')}
                      strokeWidth={1.8}
                    />
                    <span className="flex-1 font-heading text-[13px] font-semibold">{item.label}</span>
                    {badge !== null && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-primary">
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3 text-center">
          <span className="font-heading text-[9px] font-semibold uppercase tracking-[0.3em] text-white/30">
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

      {/* ── Right column ──────────────────────────────────────────────── */}
      <div className="lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-primary/10 bg-cream/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/[0.06] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/55">
              Doctor workspace
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden rounded-full border border-accent/30 px-2.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-accent sm:inline-block">
              {role.replace('_', ' ')}
            </span>
            <Link href="/" className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">
              ↗ Site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary/70 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.9} />
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
