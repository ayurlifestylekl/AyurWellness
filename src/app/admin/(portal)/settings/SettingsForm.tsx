'use client'

import { useState, useTransition } from 'react'
import { updateSiteSettings } from '@/lib/admin/settings/actions'
import type { SiteSettings } from '@/lib/admin/settings/queries'

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [state, setState] = useState<SiteSettings>(initial)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const r = await updateSiteSettings({
        business: state.business,
        commerce: state.commerce,
        booking: state.booking,
        notifications: state.notifications,
      })
      if (!r.ok) setError(r.error)
      else setSuccess(true)
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      className="flex flex-col gap-4"
    >
      {/* Business */}
      <Card title="Business" subtitle="Clinic name, contact details, and hours.">
        <Grid>
          <Field
            label="Clinic name *"
            value={state.business.clinic_name}
            onChange={(v) => setState({ ...state, business: { ...state.business, clinic_name: v } })}
          />
          <Field
            label="Phone"
            value={state.business.phone}
            onChange={(v) => setState({ ...state, business: { ...state.business, phone: v } })}
          />
          <Field
            label="Email"
            type="email"
            value={state.business.email}
            onChange={(v) => setState({ ...state, business: { ...state.business, email: v } })}
          />
          <Field
            label="WhatsApp"
            value={state.business.whatsapp}
            onChange={(v) => setState({ ...state, business: { ...state.business, whatsapp: v } })}
          />
          <Field
            label="Address"
            full
            value={state.business.address}
            onChange={(v) => setState({ ...state, business: { ...state.business, address: v } })}
          />
          <Field
            label="Business hours"
            full
            value={state.business.hours}
            onChange={(v) => setState({ ...state, business: { ...state.business, hours: v } })}
            placeholder="Mon-Sat 10:00-19:00, Sun closed"
          />
          <Field
            label="Instagram URL"
            full
            value={state.business.instagram_url}
            onChange={(v) => setState({ ...state, business: { ...state.business, instagram_url: v } })}
            placeholder="https://instagram.com/..."
          />
        </Grid>
      </Card>

      {/* Commerce */}
      <Card title="Commerce" subtitle="Tax, shipping, and currency for the storefront.">
        <Grid>
          <Field
            label="Tax rate (%)"
            type="number"
            value={String(state.commerce.tax_rate_percent)}
            onChange={(v) => setState({ ...state, commerce: { ...state.commerce, tax_rate_percent: Number(v) } })}
          />
          <Field
            label="Currency"
            value={state.commerce.currency}
            onChange={(v) => setState({ ...state, commerce: { ...state.commerce, currency: v } })}
          />
          <Field
            label="Default shipping (RM)"
            type="number"
            value={String(state.commerce.default_shipping_rm)}
            onChange={(v) => setState({ ...state, commerce: { ...state.commerce, default_shipping_rm: Number(v) } })}
          />
          <Field
            label="Free shipping above (RM)"
            type="number"
            value={String(state.commerce.free_shipping_threshold_rm)}
            onChange={(v) => setState({ ...state, commerce: { ...state.commerce, free_shipping_threshold_rm: Number(v) } })}
          />
        </Grid>
      </Card>

      {/* Booking */}
      <Card title="Booking" subtitle="Rules for consultation appointments.">
        <Grid>
          <Field
            label="Minimum lead time (hours)"
            type="number"
            value={String(state.booking.lead_time_hours)}
            onChange={(v) => setState({ ...state, booking: { ...state.booking, lead_time_hours: Number(v) } })}
          />
          <Field
            label="Maximum booking window (days)"
            type="number"
            value={String(state.booking.max_window_days)}
            onChange={(v) => setState({ ...state, booking: { ...state.booking, max_window_days: Number(v) } })}
          />
          <label className="col-span-2 flex cursor-pointer items-center gap-2 rounded-lg border border-[#006B3C]/10 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              checked={state.booking.gender_policy_enabled}
              onChange={(e) =>
                setState({
                  ...state,
                  booking: { ...state.booking, gender_policy_enabled: e.target.checked },
                })
              }
              className="h-4 w-4"
            />
            <span className="text-[13px]">
              Enforce gender policy
              <span className="ml-2 text-[11.5px] text-[#12372D]/55">
                (men-to-men, ladies-to-ladies practitioner pairing)
              </span>
            </span>
          </label>
        </Grid>
      </Card>

      {/* Notifications */}
      <Card title="Notifications" subtitle="Where alerts go and when to flag low stock.">
        <Grid>
          <Field
            label="Admin notify email"
            type="email"
            full
            value={state.notifications.admin_notify_email}
            onChange={(v) =>
              setState({ ...state, notifications: { ...state.notifications, admin_notify_email: v } })
            }
          />
          <Field
            label="Low stock threshold (units)"
            type="number"
            value={String(state.notifications.low_stock_threshold)}
            onChange={(v) =>
              setState({
                ...state,
                notifications: { ...state.notifications, low_stock_threshold: Number(v) },
              })
            }
          />
        </Grid>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-[#006B3C]/10 bg-white/95 p-3 shadow-lg shadow-black/5 backdrop-blur">
        <div className="text-[12px]">
          {error ? <span className="text-red-700">⚠ {error}</span> : null}
          {success ? <span className="text-emerald-700">✓ Settings saved.</span> : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#006B3C] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  )
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#006B3C]/10 bg-white p-5">
      <header className="mb-4">
        <h2 className="font-heading text-[15px] font-semibold text-[#006B3C]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-[#12372D]/60">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  full,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  full?: boolean
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#006B3C]/15 bg-white px-3 py-2 text-[13px] focus:border-[#006B3C] focus:outline-none"
      />
    </label>
  )
}
