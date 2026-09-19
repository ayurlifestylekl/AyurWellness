import { forwardRef } from 'react'

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  errorText?: string
}

/**
 * Shared input field for auth forms.
 * Floating label, translucent surface, gold focus ring.
 */
const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { label, hint, errorText, id, className, ...rest },
  ref
) {
  const inputId = id ?? `auth-input-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
        {label}
      </span>
      <input
        ref={ref}
        id={inputId}
        className={[
          'block w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 font-body text-[14.5px] text-white placeholder:text-white/35',
          'transition-colors duration-200',
          'hover:border-white/25',
          'focus:outline-none focus:border-[#B58A3B]/55 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#B58A3B]/25',
          errorText ? 'border-red-400/60 focus:border-red-400/80 focus:ring-red-400/20' : '',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
      {hint && !errorText && (
        <span className="mt-1.5 block font-body text-[11.5px] text-white/40">
          {hint}
        </span>
      )}
      {errorText && (
        <span className="mt-1.5 block font-body text-[12px] text-red-300/85">
          {errorText}
        </span>
      )}
    </label>
  )
})

export default AuthInput
