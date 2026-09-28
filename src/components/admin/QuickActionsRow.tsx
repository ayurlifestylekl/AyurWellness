'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, UserPlus, ShoppingCart, Search, CalendarPlus, CalendarDays, MessageSquare, type LucideIcon } from 'lucide-react'
import AddProductDialog from './AddProductDialog'
import IssueInviteDialog from './IssueInviteDialog'
import { COMMERCE_ENABLED } from '@/lib/admin/features'

export default function QuickActionsRow() {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {/* Shop actions — archived while the clinic runs on bookings only. */}
      {COMMERCE_ENABLED && (
        <>
          <ActionTile icon={Plus} label="Add product" onClick={() => setShowAddProduct(true)} />
          <ActionTile icon={UserPlus} label="Issue partner invite" onClick={() => setShowInvite(true)} />
          <ActionTile icon={ShoppingCart} label="Manual order" href="/admin/orders/new" />
        </>
      )}
      {/* Clinic actions — the live day-to-day. */}
      <ActionTile icon={CalendarPlus} label="New walk-in" href="/admin/appointments/new" />
      <ActionTile icon={CalendarDays} label="Consultations" href="/admin/appointments" />
      <ActionTile icon={MessageSquare} label="Messages" href="/admin/messages" />
      <ActionTile icon={Search} label="Find customer" href="/admin/customers" />

      {showAddProduct && <AddProductDialog onClose={() => setShowAddProduct(false)} />}
      {showInvite && <IssueInviteDialog onClose={() => setShowInvite(false)} />}
    </section>
  )
}

function ActionTile({
  icon: Icon,
  label,
  onClick,
  href,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  href?: string
}) {
  const body = (
    <div
      className="group flex h-full items-center gap-3 rounded-2xl border border-[#12372D]/[0.06] bg-white px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B58A3B]/40 lg:flex-col lg:items-start lg:gap-4 lg:p-4"
      style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.04)' }}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#12372D] text-[#E4C384] transition-colors group-hover:bg-[#B58A3B] group-hover:text-white">
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>
      <span className="font-heading text-[12.5px] font-semibold leading-snug text-[#12372D]">{label}</span>
    </div>
  )
  return href ? (
    <Link href={href} className="block h-full">{body}</Link>
  ) : (
    <button type="button" onClick={onClick} className="h-full w-full text-left">
      {body}
    </button>
  )
}
