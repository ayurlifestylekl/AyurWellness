import { Sparkles } from 'lucide-react'

interface AuthCardProps {
  eyebrow?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

/** Heading + body for the secondary auth pages, rendered inside CustomerLoginSplit's card. */
export default function AuthCard({ eyebrow, title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="w-full">
      {eyebrow && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#B58A3B]/30 bg-[#FBF6EC] px-3 py-1">
          <Sparkles className="h-3 w-3 text-[#B58A3B]" />
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A6420]">{eyebrow}</span>
        </div>
      )}
      <h1 className="font-heading text-[28px] font-bold leading-tight text-[#12372D] sm:text-[32px]" style={{ letterSpacing: '-0.025em' }}>
        {title}
      </h1>
      {subtitle && <p className="mt-3 font-body text-[14px] leading-relaxed text-[#12372D]/60">{subtitle}</p>}
      <div aria-hidden className="mt-6 flex items-center gap-3">
        <span className="h-px w-10 bg-[#B58A3B]" />
        <span className="h-px flex-1 bg-[#12372D]/10" />
      </div>
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 text-center font-body text-[13px] text-[#12372D]/55">{footer}</div>}
    </div>
  )
}
