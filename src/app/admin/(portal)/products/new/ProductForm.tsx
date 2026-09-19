'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/lib/admin/products/actions'

type Status = 'active' | 'draft' | 'archived'
type Dosha = 'vata' | 'pitta' | 'kapha' | 'tridosha' | 'none'

export interface ProductFormValues {
  id?: string
  name: string
  sku: string
  price_rm: number
  sale_price_rm: number | null
  member_price_rm: number | null
  short_description: string
  description: string
  ingredients: string
  dosage_instructions: string
  contraindications: string
  certifications: string
  dosha_indication: Dosha
  category: string
  tags: string[]
  status: Status
  featured: boolean
  meta_title: string
  meta_description: string
  weight_grams: number | null
  expiry_date: string
  low_stock_threshold: number | null
  allow_backorder: boolean
  is_bundle: boolean
  image_url: string
  stock_qty: number
  wholesale_enabled: boolean
  wholesale_price_rm: number | null
}

export const EMPTY_FORM: ProductFormValues = {
  name: '',
  sku: '',
  price_rm: 0,
  sale_price_rm: null,
  member_price_rm: null,
  short_description: '',
  description: '',
  ingredients: '',
  dosage_instructions: '',
  contraindications: '',
  certifications: '',
  dosha_indication: 'none',
  category: '',
  tags: [],
  status: 'active',
  featured: false,
  meta_title: '',
  meta_description: '',
  weight_grams: null,
  expiry_date: '',
  low_stock_threshold: null,
  allow_backorder: false,
  is_bundle: false,
  image_url: '',
  stock_qty: 0,
  wholesale_enabled: false,
  wholesale_price_rm: null,
}

export default function ProductForm({
  initial,
  mode,
}: {
  initial?: Partial<ProductFormValues>
  mode: 'create' | 'edit'
}) {
  const router = useRouter()
  const [v, setV] = useState<ProductFormValues>({ ...EMPTY_FORM, ...initial })
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function field<K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }))
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t || v.tags.includes(t)) return
    field('tags', [...v.tags, t])
    setTagInput('')
  }

  function removeTag(t: string) {
    field(
      'tags',
      v.tags.filter((x) => x !== t),
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const payload = {
        ...v,
        tags: v.tags.length > 0 ? v.tags : undefined,
        sale_price_rm: v.sale_price_rm ?? null,
        member_price_rm: v.member_price_rm ?? null,
        weight_grams: v.weight_grams ?? null,
        low_stock_threshold: v.low_stock_threshold ?? null,
        wholesale_price_rm: v.wholesale_price_rm ?? null,
      }
      if (mode === 'create') {
        const r = await createProduct(payload)
        if (!r.ok) {
          setError(r.error)
          return
        }
        const newId = (r as { ok: true; data?: { id: string; slug: string } }).data?.id
        if (newId) router.push(`/admin/products/${newId}`)
      } else {
        if (!initial?.id) {
          setError('Missing product id.')
          return
        }
        const r = await updateProduct(initial.id, payload)
        if (!r.ok) {
          setError(r.error)
          return
        }
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Basics */}
      <Section title="Basics">
        <Row>
          <Field label="Name *">
            <input
              required
              value={v.name}
              onChange={(e) => field('name', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="SKU *">
            <input
              required
              value={v.sku}
              onChange={(e) => field('sku', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Row>
        <Field label="Short description (1-line)">
          <input
            value={v.short_description}
            onChange={(e) => field('short_description', e.target.value)}
            maxLength={500}
            className={inputCls}
          />
        </Field>
        <Field label="Description (full)">
          <textarea
            value={v.description}
            onChange={(e) => field('description', e.target.value)}
            rows={4}
            className={inputCls}
          />
        </Field>
        <Field label="Category">
          <input
            value={v.category}
            onChange={(e) => field('category', e.target.value)}
            placeholder="Haircare, Skincare, Wellness…"
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <Row>
          <Field label="Price (RM) *">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={v.price_rm}
              onChange={(e) => field('price_rm', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Sale price (RM)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={v.sale_price_rm ?? ''}
              onChange={(e) =>
                field('sale_price_rm', e.target.value === '' ? null : Number(e.target.value))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Member price (RM)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={v.member_price_rm ?? ''}
              onChange={(e) =>
                field(
                  'member_price_rm',
                  e.target.value === '' ? null : Number(e.target.value),
                )
              }
              className={inputCls}
            />
          </Field>
        </Row>
        <Field label="Weight (grams) — used for shipping calc later">
          <input
            type="number"
            min="0"
            value={v.weight_grams ?? ''}
            onChange={(e) =>
              field('weight_grams', e.target.value === '' ? null : Number(e.target.value))
            }
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Wholesale */}
      <Section title="Wholesale (partner shop)">
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#006B3C]/10 bg-[#EDF4E7]/30 px-3 py-2.5">
          <input
            type="checkbox"
            checked={v.wholesale_enabled}
            onChange={(e) => field('wholesale_enabled', e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-[12.5px] text-[#006B3C]">
            <strong>Available in the partner wholesale shop</strong>
            <span className="block text-[11px] text-[#12372D]/60">
              Reseller-capable partners can buy this product at the wholesale
              price below. Disable to hide it from the shop.
            </span>
          </span>
        </label>
        <Field label="Wholesale price (RM)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={v.wholesale_price_rm ?? ''}
            placeholder={
              v.price_rm > 0
                ? `Suggested: RM ${(v.price_rm * 0.6).toFixed(2)} (60% of retail)`
                : 'Required to enable wholesale'
            }
            onChange={(e) =>
              field(
                'wholesale_price_rm',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            className={inputCls}
            disabled={!v.wholesale_enabled}
          />
        </Field>
        {v.wholesale_enabled && !v.wholesale_price_rm ? (
          <p className="text-[11px] text-amber-700">
            ⚠ Set a wholesale price before saving — otherwise partners will see RM 0.
          </p>
        ) : null}
      </Section>

      {/* Ayurvedic */}
      <Section title="Ayurvedic details">
        <Field label="Ingredients">
          <textarea
            value={v.ingredients}
            onChange={(e) => field('ingredients', e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="Comma-separated or free text"
          />
        </Field>
        <Field label="Dosage instructions">
          <textarea
            value={v.dosage_instructions}
            onChange={(e) => field('dosage_instructions', e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>
        <Field label="Contraindications">
          <textarea
            value={v.contraindications}
            onChange={(e) => field('contraindications', e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>
        <Row>
          <Field label="Dosha indication">
            <select
              value={v.dosha_indication}
              onChange={(e) => field('dosha_indication', e.target.value as Dosha)}
              className={inputCls}
            >
              <option value="none">None / general</option>
              <option value="vata">Vata</option>
              <option value="pitta">Pitta</option>
              <option value="kapha">Kapha</option>
              <option value="tridosha">Tridosha</option>
            </select>
          </Field>
          <Field label="Certifications">
            <input
              value={v.certifications}
              onChange={(e) => field('certifications', e.target.value)}
              placeholder="KKM, GMP, Organic…"
              className={inputCls}
            />
          </Field>
        </Row>
      </Section>

      {/* Inventory */}
      <Section title="Inventory">
        <Row>
          {mode === 'create' ? (
            <Field label="Initial stock qty">
              <input
                type="number"
                min="0"
                value={v.stock_qty}
                onChange={(e) => field('stock_qty', Math.max(0, Number(e.target.value)))}
                className={inputCls}
              />
            </Field>
          ) : (
            <Field label="Stock managed via Inventory page">
              <p className="rounded-lg border border-dashed border-[#006B3C]/20 bg-[#EDF4E7]/40 px-3 py-2 text-[12px] text-[#12372D]/65">
                Use the Inventory page to receive / write-off / recount stock for this SKU.
              </p>
            </Field>
          )}
          <Field label="Low-stock threshold (overrides global 5)">
            <input
              type="number"
              min="0"
              value={v.low_stock_threshold ?? ''}
              onChange={(e) =>
                field(
                  'low_stock_threshold',
                  e.target.value === '' ? null : Number(e.target.value),
                )
              }
              className={inputCls}
            />
          </Field>
          <Field label="Expiry date (next batch)">
            <input
              type="date"
              value={v.expiry_date}
              onChange={(e) => field('expiry_date', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Row>
        <Field label="">
          <label className="flex items-center gap-2 text-[12.5px]">
            <input
              type="checkbox"
              checked={v.allow_backorder}
              onChange={(e) => field('allow_backorder', e.target.checked)}
            />
            Allow backorder (sell even when out of stock)
          </label>
        </Field>
        <Field label="">
          <label className="flex items-center gap-2 text-[12.5px]">
            <input
              type="checkbox"
              checked={v.is_bundle}
              onChange={(e) => field('is_bundle', e.target.checked)}
            />
            This is a bundle (kit) — manage components on the detail page after saving
          </label>
        </Field>
      </Section>

      {/* SEO + Status */}
      <Section title="SEO + status">
        <Field label="Meta title">
          <input
            value={v.meta_title}
            onChange={(e) => field('meta_title', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Meta description">
          <textarea
            value={v.meta_description}
            onChange={(e) => field('meta_description', e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>
        <Row>
          <Field label="Status">
            <select
              value={v.status}
              onChange={(e) => field('status', e.target.value as Status)}
              className={inputCls}
            >
              <option value="active">Active (visible on storefront)</option>
              <option value="draft">Draft (hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="">
            <label className="flex items-center gap-2 pt-6 text-[12.5px]">
              <input
                type="checkbox"
                checked={v.featured}
                onChange={(e) => field('featured', e.target.checked)}
              />
              Featured (homepage / shortlist)
            </label>
          </Field>
        </Row>
        <Field label="Tags">
          <div className="flex flex-wrap items-center gap-2">
            {v.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-[#006B3C]/15 bg-white px-2 py-0.5 text-[11px]"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="text-[#12372D]/55 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="Type tag + Enter"
              className="rounded-lg border border-[#006B3C]/15 px-2 py-1 text-[12px]"
            />
          </div>
        </Field>
      </Section>

      {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !v.name || !v.sku}
          className="rounded-lg bg-[#006B3C] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
        >
          {pending ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

// ─── small UI primitives ──────────────────────────────────────────────────

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
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
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
