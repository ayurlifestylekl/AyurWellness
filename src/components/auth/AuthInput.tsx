import { forwardRef } from 'react'

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  errorText?: string
  /** 'light' for forms on a white card; defaults to the dark auth canvas. */
  tone?: 'dark' | 'light'
}

/**
 * Shared input field for auth forms.
 * Floating label, translucent surface, gold focus ring.
 */
const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { label, hint, errorText, id, className, tone = 'dark', ...rest },
  ref
) {
  const inputId = id ?? `auth-input-${label.toLowerCase().replace(/\s+/g, '-')}`
  const light = tone === 'light'
  return (
    <label htmlFor={inputId} className="block">
      <span className={`mb-1.5 block font-heading text-[11px] font-semibold uppercase tracking-[0.18em] ${light ? 'text-[#12372D]/65' : 'text-white/65'}`}>
        {label}
      </span>
      <input
        ref={ref}
        id={inputId}
        className={[
          light
            ? 'block h-[52px] w-full rounded-xl border border-[#12372D]/12 bg-[#FAFAF7] px-4 font-body text-[15px] text-[#12372D] placeholder:text-[#12372D]/30 transition-all duration-200 hover:border-[#12372D]/25 focus:border-[#006B3C] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006B3C]/10'
            : 'block w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 font-body text-[14.5px] text-white placeholder:text-white/35 transition-colors duration-200 hover:border-white/25 focus:outline-none focus:border-[#B58A3B]/55 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#B58A3B]/25',
          errorText ? (light ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-red-400/60 focus:border-red-400/80 focus:ring-red-400/20') : '',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
      {hint && !errorText && (
        <span className={`mt-1.5 block font-body text-[11.5px] ${light ? 'text-[#12372D]/45' : 'text-white/40'}`}>
          {hint}
        </span>
      )}
      {errorText && (
        <span className={`mt-1.5 block font-body text-[12px] ${light ? 'text-red-700' : 'text-red-300/85'}`}>
          {errorText}
        </span>
      )}
    </label>
  )
})

export default AuthInput
