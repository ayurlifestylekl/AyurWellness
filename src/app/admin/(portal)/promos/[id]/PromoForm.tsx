'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createPromo,
  updatePromo,
  setPromoActive,
  deletePromo,
} from '@/lib/admin/promos/actions'

type Kind = 'percentage' | 'fixed' | 'free-shipping'
type AppliesTo = 'all' | 'products' | 'treatments' | 'consultation'

export interface PromoFormValues {
  id?: string
  code: string
  title: string
  description: string
  kind: Kind
  value_amount: number | null
  min_spend_rm: number
  applies_to: AppliesTo
  starts_at: string
  expires_at: string
  is_public: boolean
  is_active: boolean
}

export const EMPTY_PROMO: PromoFormValues = {
  code: '',
  title: '',
  description: '',
  kind: 'percentage',
  value_amount: 10,
  min_spend_rm: 0,
  applies_to: 'all',
  starts_at: new Date().toISOString().slice(0, 10),
  expires_at: '',
  is_public: true,
  is_active: true,
}

export default function PromoForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial?: Partial<PromoFormValues>
}) {
  const router = useRouter()
  const [v, setV] = useState<PromoFormValues>({ ...EMPTY_PROMO, ...initial })
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function field<K extends keyof PromoFormValues>(k: K, val: PromoFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const payload = {
        ...v,
        description: v.description || undefined,
        expires_at: v.expires_at || null,
        starts_at: new Date(v.starts_at).toISOString(),
        value_amount: v.kind === 'free-shipping' ? null : v.value_amount,
      }
      if (mode === 'create') {
        const r = await createPromo(payload)
        if (!r.ok) {
          setError(r.error)
          return
        }
        const id = (r as { ok: true; data?: { id: string } }).data?.id
        if (id) router.push(`/admin/promos/${id}`)
      } else {
        if (!initial?.id) {
          setError('Missing promo id.')
          return
        }
        const r = await updatePromo(initial.id, payload)
        if (!r.ok) {
          setError(r.error)
          return
        }
        router.refresh()
      }
    })
  }

  function toggleActive() {
    if (!initial?.id) return
    startTransition(async () => {
      await setPromoActive(initial.id!, !v.is_active)
      field('is_active', !v.is_active)
      router.refresh()
    })
  }

  function doDelete() {
    if (!initial?.id) return
    if (!confirm('Delete this promo? Only allowed if never granted.')) return
    startTransition(async () => {
      const r = await deletePromo(initial.id!)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.push('/admin/promos')
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Section title="Basics">
        <Row>
          <Field label="Code *">
            <input
              required
              value={v.code}
              onChange={(e) => field('code', e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className={inputCls}
            />
          </Field>
          <Field label="Title *">
            <input
              required
              value={v.title}
              onChange={(e) => field('title', e.target.value)}
              placeholder="Welcome discount"
              className={inputCls}
            />
          </Field>
        </Row>
        <Field label="Description (shown to customer)">
          <textarea
            value={v.description}
            onChange={(e) => field('description', e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Discount">
        <Row>
          <Field label="Type *">
            <select
              value={v.kind}
              onChange={(e) => field('kind', e.target.value as Kind)}
              className={inputCls}
            >
              <option value="percentage">% off</option>
              <option value="fixed">RM off</option>
              <option value="free-shipping">Free shipping</option>
            </select>
          </Field>
          {v.kind !== 'free-shipping' ? (
            <Field label={v.kind === 'percentage' ? '% off' : 'RM off'}>
              <input
                type="number"
                min="0"
                step={v.kind === 'percentage' ? '1' : '0.01'}
                value={v.value_amount ?? 0}
                onChange={(e) => field('value_amount', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          ) : null}
          <Field label="Min spend (RM)">
            <input
              type="number"
              min="0"
              value={v.min_spend_rm}
              onChange={(e) => field('min_spend_rm', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
        </Row>
        <Field label="Applies to">
          <select
            value={v.applies_to}
            onChange={(e) => field('applies_to', e.target.value as AppliesTo)}
            className={inputCls}
          >
            <option value="all">All purchases</option>
            <option value="products">Products only</option>
            <option value="treatments">Treatments only</option>
            <option value="consultation">Consultation only</option>
          </select>
        </Field>
      </Section>

      <Section title="Validity + visibility">
        <Row>
          <Field label="Starts on">
            <input
              type="date"
              value={v.starts_at}
              onChange={(e) => field('starts_at', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Expires on (blank = no expiry)">
            <input
              type="date"
              value={v.expires_at}
              onChange={(e) => field('expires_at', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Row>
        <Field label="">
          <label className="flex items-center gap-2 text-[12.5px]">
            <input
              type="checkbox"
              checked={v.is_public}
              onChange={(e) => field('is_public', e.target.checked)}
            />
            Public — customers can find and enter this code at checkout
          </label>
        </Field>
        <Field label="">
          <label className="flex items-center gap-2 text-[12.5px]">
            <input
              type="checkbox"
              checked={v.is_active}
              onChange={(e) => field('is_active', e.target.checked)}
            />
            Active — can be redeemed right now
          </label>
        </Field>
      </Section>

      {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending || !v.code || !v.title}
          className="rounded-lg bg-[#006B3C] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
        >
          {pending ? 'Saving…' : mode === 'create' ? 'Create promo' : 'Save changes'}
        </button>
        {mode === 'edit' ? (
          <>
            <button
              type="button"
              onClick={toggleActive}
              disabled={pending}
              className="rounded-lg border border-[#006B3C]/20 bg-white px-4 py-2 text-[13px] font-semibold text-[#006B3C] disabled:opacity-50"
            >
              {v.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              onClick={doDelete}
              disabled={pending}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[13px] font-semibold text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </form>
  )
}

const inputCls =
  'w-full rounded-lg border border-[#006B3C]/15 bg-white px-3 py-2 text-[13px] focus:border-[#006B3C] focus:outline-none'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
        {title}
      </legend>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </fieldset>
  )
}
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      {label ? (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          {label}
        </span>
      ) : null}
      {children}
    </label>
  )
}
