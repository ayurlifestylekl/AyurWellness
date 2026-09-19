import Link from 'next/link'
import type { TicketListItem } from '@/lib/admin/messages/queries'

const STATUS_CLASS: Record<string, string> = {
  open:                'bg-amber-50 text-amber-700 border-amber-200',
  'awaiting-customer': 'bg-blue-50 text-blue-700 border-blue-200',
  resolved:            'bg-emerald-100 text-emerald-800 border-emerald-300',
  closed:              'bg-slate-100 text-slate-700 border-slate-300',
}

const STATUS_LABEL: Record<string, string> = {
  open:                'Open',
  'awaiting-customer': 'Awaiting customer',
  resolved:            'Resolved',
  closed:              'Closed',
}

const TOPIC_LABEL: Record<string, string> = {
  treatment: 'Treatment',
  prescription: 'Prescription',
  appointment: 'Appointment',
  order: 'Order',
  billing: 'Billing',
  welcome: 'Welcome',
  other: 'Other',
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-MY')
}

export default function MessagesList({ items }: { items: TicketListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        Inbox zero. Nothing to reply to right now.
      </div>
    )
  }
  return (
    <ul className="flex flex-col divide-y divide-[#006B3C]/6 overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white">
      {items.map((t) => (
        <li key={t.id}>
          <Link
            href={`/admin/messages/${t.id}`}
            className="block px-5 py-3.5 transition-colors hover:bg-[#EDF4E7]/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {t.unreadByClinic ? (
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-[#B58A3B]"
                    aria-label="Unread"
                  />
                ) : (
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-transparent"
                    aria-hidden="true"
                  />
                )}
                <p
                  className={`truncate text-[14px] ${
                    t.unreadByClinic
                      ? 'font-bold text-[#006B3C]'
                      : 'font-semibold text-[#006B3C]/80'
                  }`}
                >
                  {t.subject}
                </p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[t.status] ?? ''}`}
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
                <span className="hidden shrink-0 rounded-full border border-[#006B3C]/15 bg-[#EDF4E7]/40 px-2 py-0.5 text-[10.5px] font-semibold text-[#006B3C]/70 md:inline-block">
                  {TOPIC_LABEL[t.topic] ?? t.topic}
                </span>
              </div>
              <span className="shrink-0 text-[11.5px] text-[#12372D]/55">
                {relativeTime(t.lastMessageAt)}
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-[#12372D]/65">
              <span className="font-semibold">{t.customerName ?? 'Unknown'}</span>
              {t.customerEmail ? <span className="ml-2">{t.customerEmail}</span> : null}
            </p>
            {t.lastMessagePreview ? (
              <p className="mt-1 line-clamp-2 text-[12.5px] text-[#12372D]/55">
                {t.lastMessagePreview}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
