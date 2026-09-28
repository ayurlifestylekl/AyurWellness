import { Lock, type LucideIcon } from 'lucide-react'

interface PromoLockedCardProps {
  title: string
  description: string
  icon: LucideIcon
}

export default function PromoLockedCard({
  title,
  description,
  icon: Icon,
}: PromoLockedCardProps) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#006B3C]/6 bg-[#EDF4E7]/30 p-5 opacity-80"
      style={{
        boxShadow:
          '0 1px 2px rgba(18,55,45,0.05), 0 26px 50px -34px rgba(60,45,20,0.45)',
      }}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
          <Icon className="h-4 w-4 text-[#12372D]/45" strokeWidth={1.8} />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#B58A3B]/35 bg-[#B58A3B]/[0.08] px-2 py-0.5 font-heading text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#B58A3B]">
          <Lock className="h-2.5 w-2.5" strokeWidth={2.2} />
          Coming soon
        </span>
      </div>
      <div className="mt-4 flex-1">
        <h3
          className="font-heading text-[14px] font-bold text-[#12372D]/85"
          style={{ letterSpacing: '-0.005em' }}
        >
          {title}
        </h3>
        <p
          className="mt-1 font-body text-[12px] text-[#12372D]/60"
          style={{ lineHeight: 1.55 }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
