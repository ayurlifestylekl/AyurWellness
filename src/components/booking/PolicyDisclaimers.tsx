'use client'

import { Users, MessageCircle, Timer } from 'lucide-react'

interface PolicyDisclaimersProps {
  accepted: boolean
  onAcceptedChange: (v: boolean) => void
}

const POLICIES = [
  {
    icon: Users,
    title: 'Same-gender therapists',
    body: 'For your comfort and in line with our practice, male therapists treat male guests and female therapists treat female guests. There are no mixed-gender arrangements.',
  },
  {
    icon: MessageCircle,
    title: 'Rescheduling, cancellation & refunds',
    body: 'All rescheduling, cancellations, and refund requests are handled directly via WhatsApp — message us and our team will assist you.',
  },
  {
    icon: Timer,
    title: 'Please arrive 15 minutes early',
    body: 'Kindly arrive 15 minutes before your scheduled appointment at the centre. Late arrivals will result in a shortened therapy session so we remain on schedule for all guests.',
  },
]

export default function PolicyDisclaimers({ accepted, onAcceptedChange }: PolicyDisclaimersProps) {
  return (
    <div className="rounded-xl border border-accent/30 bg-white/70 p-5">
      <div className="mb-3 font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
        Before you book
      </div>
      <ul className="space-y-3">
        {POLICIES.map((p) => (
          <li key={p.title} className="flex gap-3">
            <p.icon className="mt-0.5 h-4 w-4 flex-none text-accent" strokeWidth={2} aria-hidden />
            <div>
              <div className="font-heading text-[12.5px] font-bold text-primary">{p.title}</div>
              <p className="font-body text-[12.5px] leading-snug text-dark/70">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-accent/15 pt-4">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none accent-[#149447]"
        />
        <span className="font-body text-[13px] leading-snug text-dark/80">
          I understand and accept the gender-matching policy, and that rescheduling, cancellation, and refunds are handled via WhatsApp.
        </span>
      </label>
    </div>
  )
}
