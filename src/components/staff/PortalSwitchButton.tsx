'use client'

import { ArrowLeftRight } from 'lucide-react'
import { switchPortal } from '@/actions/auth/switchPortal'
import { switchButton, type Portal } from '@/lib/staff/portal-switch'

/**
 * "Switch to Doctor" / "Switch to Front desk". Hidden for roles it doesn't
 * apply to. Admin jumps straight over; others confirm first because it signs
 * them out (so nothing half-written is lost by surprise).
 */
export default function PortalSwitchButton({ role, current, className = '' }: { role: string; current: Portal; className?: string }) {
  const b = switchButton(role, current)
  if (!b) return null
  return (
    <form
      action={switchPortal.bind(null, b.target)}
      onSubmit={(e) => {
        if (b.confirm && !window.confirm(b.confirm)) e.preventDefault()
      }}
    >
      <button
        type="submit"
        title={b.instant ? b.label : `${b.label} (signs you out first)`}
        className={`inline-flex h-10 items-center gap-1.5 rounded-xl border border-accent/40 bg-white px-3.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent/10 ${className}`}
      >
        <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">{b.label}</span>
        <span className="sm:hidden">{b.target === 'doctor' ? 'Doctor' : 'Front desk'}</span>
      </button>
    </form>
  )
}
