import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMarketplaceOrderById } from '@/lib/admin/marketplace-orders/queries'
import { EXTERNAL_CHANNEL_LABEL } from '@/lib/admin/external-sales/queries'
import ApproveRejectBar from './ApproveRejectBar'

export const metadata = { title: 'Marketplace Order · Admin' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

export default async function MarketplaceOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const row = await getMarketplaceOrderById(supabase, params.id)
  if (!row) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m: any = row
  const agent = Array.isArray(m.agent) ? m.agent[0] : m.agent
  const agentUser = agent ? (Array.isArray(agent.user) ? agent.user[0] : agent.user) : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = Array.isArray(m.items) ? m.items : []

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Link
        href="/admin/marketplace-orders"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to marketplace orders
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
              {EXTERNAL_CHANNEL_LABEL[
                m.channel as keyof typeof EXTERNAL_CHANNEL_LABEL
              ]}{' '}
              order
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[m.status] ?? ''}`}
            >
              {m.status}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#12372D]/65">
            Received {new Date(m.created_at).toLocaleString('en-MY')}
            {m.marketplace_order_ref ? (
              <>
                {' '}
                · Ref{' '}
                <code className="font-mono">{m.marketplace_order_ref}</code>
              </>
            ) : null}
          </p>
        </div>
      </header>

      <ApproveRejectBar
        marketplaceOrderId={m.id}
        status={m.status}
        createdOrderId={m.created_order_id}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4 lg:col-span-2">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">Items</h2>
          {items.length === 0 ? (
            <p className="mt-2 text-[12px] italic text-[#12372D]/55">No items.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[420px] mt-3 w-full text-left text-[13px]">
                <thead className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  <tr>
                    <th className="py-2">Product</th>
                    <th className="py-2">SKU</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Unit</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#006B3C]/6">
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td className="py-2">{it.product_name}</td>
                      <td className="py-2 text-[11.5px] text-[#12372D]/65">
                        {it.sku ?? '—'}
                      </td>
                      <td className="py-2 text-right">{it.quantity}</td>
                      <td className="py-2 text-right">
                        RM {Number(it.unit_price_rm).toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        RM {(Number(it.unit_price_rm) * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="text-[12.5px]">
                  <tr>
                    <td colSpan={4} className="pt-3 text-right text-[#12372D]/65">
                      Subtotal
                    </td>
                    <td className="pt-3 text-right">
                      RM {Number(m.subtotal_rm).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="text-right text-[#12372D]/65">
                      Shipping
                    </td>
                    <td className="text-right">RM {Number(m.shipping_rm).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      className="pt-1 text-right font-semibold text-[#006B3C]"
                    >
                      Total
                    </td>
                    <td className="pt-1 text-right font-semibold text-[#006B3C]">
                      RM {Number(m.total_amount_rm).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {m.notes ? (
            <p className="mt-3 rounded-lg border border-[#006B3C]/8 bg-[#EDF4E7]/30 p-3 text-[12px] italic text-[#12372D]/70">
              {m.notes}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">Customer</h2>
          <p className="mt-2 text-[13px] font-semibold">{m.customer_name}</p>
          {m.customer_phone ? (
            <p className="text-[12px] text-[#12372D]/65">{m.customer_phone}</p>
          ) : null}
          {m.customer_email ? (
            <p className="text-[12px] text-[#12372D]/65">{m.customer_email}</p>
          ) : null}

          {m.customer_address ? (
            <div className="mt-3 border-t border-[#006B3C]/6 pt-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                Ship to
              </p>
              <p className="mt-1 whitespace-pre-line text-[12.5px] text-[#12372D]/85">
                {m.customer_address}
              </p>
              <p className="mt-0.5 text-[12px] text-[#12372D]/65">
                {[m.customer_city, m.customer_postcode, m.customer_state]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          ) : null}

          {m.payment_proof_url ? (
            <div className="mt-3 border-t border-[#006B3C]/6 pt-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                Proof of sale
              </p>
              <a
                href={m.payment_proof_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-[11.5px] font-semibold text-[#B58A3B] hover:underline"
              >
                {m.payment_proof_url}
              </a>
            </div>
          ) : null}

          {agent ? (
            <div className="mt-4 border-t border-[#006B3C]/6 pt-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                Attributed to
              </h3>
              <p className="mt-1 text-[13px] font-semibold">
                {agentUser?.full_name ?? '—'}
              </p>
              <p className="text-[11.5px] text-[#12372D]/55">
                <code className="font-mono">{agent.referral_code}</code>
              </p>
              <p className="mt-2 text-[11px] italic text-[#12372D]/55">
                Commission will be created automatically when this order is approved.
              </p>
            </div>
          ) : (
            <p className="mt-4 border-t border-[#006B3C]/6 pt-4 text-[11.5px] italic text-[#12372D]/55">
              No agent attribution. (To add later, edit before approving — or leave as direct sale.)
            </p>
          )}

          {m.rejection_reason ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-800">
              <strong>Rejected:</strong> {m.rejection_reason}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  )
}
