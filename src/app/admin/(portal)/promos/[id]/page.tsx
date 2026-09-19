import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPromoById } from '@/lib/admin/promos/queries'
import PromoForm, { type PromoFormValues } from './PromoForm'

export const metadata = { title: 'Voucher · Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPromoEditPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const promo = await getPromoById(supabase, params.id)
  if (!promo) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = promo
  const initial: Partial<PromoFormValues> = {
    id: p.id,
    code: p.code,
    title: p.title,
    description: p.description ?? '',
    kind: p.kind,
    value_amount: p.value_amount != null ? Number(p.value_amount) : null,
    min_spend_rm: Number(p.min_spend_rm),
    applies_to: p.applies_to,
    starts_at: p.starts_at ? new Date(p.starts_at).toISOString().slice(0, 10) : '',
    expires_at: p.expires_at ? new Date(p.expires_at).toISOString().slice(0, 10) : '',
    is_public: p.is_public,
    is_active: p.is_active,
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/admin/promos"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to vouchers
      </Link>
      <header>
        <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
          {p.title}
        </h1>
        <p className="mt-1 text-[12.5px] text-[#12372D]/65">
          Code <code className="font-mono">{p.code}</code> · created{' '}
          {new Date(p.created_at).toLocaleDateString('en-MY')}
        </p>
      </header>
      <PromoForm mode="edit" initial={initial} />
    </div>
  )
}
