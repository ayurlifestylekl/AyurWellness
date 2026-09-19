import { Sparkles } from 'lucide-react'

interface AuthCardProps {
  eyebrow?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

/**
 * Shared shell for every auth page (login, register, forgot, reset).
 * Glassy dark card on the auth layout's atmospheric background.
 */
export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-[28px] border border-[#B58A3B]/22 bg-gradient-to-b from-[#12372D]/95 via-[#12372D]/95 to-[#12372D]/95 p-8 backdrop-blur-xl sm:p-10"
        style={{
          boxShadow:
            '0 24px 60px -18px rgba(0,0,0,0.45), 0 8px 20px -10px rgba(0,0,0,0.35), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Subtle grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6' /></svg>\")",
          }}
        />

        <div className="relative">
          {eyebrow && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#B58A3B]/30 bg-[#B58A3B]/10 px-3 py-1">
              <Sparkles className="h-3 w-3 text-[#B58A3B]" />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
                {eyebrow}
              </span>
            </div>
          )}

          <h1
            className="font-heading text-2xl font-bold leading-tight text-white sm:text-[28px]"
            style={{ letterSpacing: '-0.02em' }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="mt-2.5 font-body text-[13.5px] text-white/60"
              style={{ lineHeight: 1.6 }}
            >
              {subtitle}
            </p>
          )}

          <div className="mt-7">{children}</div>
        </div>
      </div>

      {footer && (
        <div className="mt-6 text-center font-body text-[13px] text-white/55">
          {footer}
        </div>
      )}
    </div>
  )
}
