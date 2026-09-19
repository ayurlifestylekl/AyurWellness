import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getCustomerById } from '@/lib/admin/customers/queries'
import { listPromos } from '@/lib/admin/promos/queries'
import {
  DEMO_ADMIN_EMAIL,
  MOCK_CUSTOMERS,
} from '@/lib/admin/customers/mocks'
import PushVoucherDialog from './PushVoucherDialog'
import InternalNotesPanel from './InternalNotesPanel'
import CustomerActions from './CustomerActions'

export const metadata = { title: 'Customer · Admin' }
export const dynamic = 'force-dynamic'

function isMockCustomerId(id: string) {
  return id.startsWith('00000000-mockc-')
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const me = await getCurrentUser()
  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const wantMock = isDemoAdmin && isMockCustomerId(params.id)

  let customer
  if (wantMock) {
    const mock = MOCK_CUSTOMERS.find((c) => c.id === params.id)
    if (!mock) notFound()
    customer = {
      id: mock.id,
      full_name: mock.fullName,
      email: mock.email,
      phone_number: mock.phone,
      created_at: mock.createdAt,
      tags: mock.tags,
      blocked_at: mock.blocked ? new Date().toISOString() : null,
      blocked_reason: mock.blocked ? 'Demo block reason' : null,
      gender: null,
      date_of_birth: null,
      language: 'en',
      allergies: null,
      current_medications: null,
      medical_conditions: null,
      height_cm: null,
      weight_kg: null,
      internal_notes: null,
      addresses: [],
      orders: [],
      appointments: [],
      support_tickets: [],
      customer_promos: [],
      quiz_results: mock.doshaPrimary
        ? [{ prakriti_primary: mock.doshaPrimary }]
        : [],
    }
  } else {
    customer = await getCustomerById(supabase, params.id)
    if (!customer) notFound()
  }

  const promoList = await listPromos(supabase)
  const promosForDialog = promoList.map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    kind: p.kind,
    value_amount: p.valueAmount,
    is_active: p.isActive,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = customer
  const addresses = Array.isArray(c.addresses) ? c.addresses : []
  const orders = Array.isArray(c.orders) ? c.orders : []
  const appointments = Array.isArray(c.appointments) ? c.appointments : []
  const tickets = Array.isArray(c.support_tickets) ? c.support_tickets : []
  const vouchers = Array.isArray(c.customer_promos) ? c.customer_promos : []
  const quiz = Array.isArray(c.quiz_results) ? c.quiz_results[0] : c.quiz_results

  const paidOrders = orders.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o: any) => o.payment_status === 'paid',
  )
  const ltv = paidOrders.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: number, o: any) => s + Number(o.total_amount_rm ?? 0),
    0,
  )
  const aov = paidOrders.length > 0 ? ltv / paidOrders.length : 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link
        href="/admin/customers"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to customers
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
              {c.full_name ?? 'Unnamed customer'}
            </h1>
            {c.blocked_at ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                Blocked
              </span>
            ) : null}
            {wantMock ? (
              <span className="rounded-full border border-[#B58A3B]/40 bg-[#EDF4E7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B58A3B]">
                Demo data
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] text-[#12372D]/65">
            Member since {new Date(c.created_at).toLocaleDateString('en-MY')} ·{' '}
            {paidOrders.length} paid order{paidOrders.length === 1 ? '' : 's'} ·
            LTV RM {ltv.toFixed(2)} · AOV RM {aov.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PushVoucherDialog
            customerId={c.id}
            customerName={c.full_name ?? 'this customer'}
            promos={promosForDialog}
          />
        </div>
      </header>

      <CustomerActions
        customerId={c.id}
        isBlocked={!!c.blocked_at}
        blockedReason={c.blocked_reason}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Identity + wellness */}
        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Identity
          </h2>
          <dl className="mt-3 grid grid-cols-3 gap-y-2 text-[12.5px]">
            <dt className="col-span-1 text-[#12372D]/55">Email</dt>
            <dd className="col-span-2 break-all">{c.email ?? '—'}</dd>
            <dt className="col-span-1 text-[#12372D]/55">Phone</dt>
            <dd className="col-span-2">{c.phone_number ?? '—'}</dd>
            <dt className="col-span-1 text-[#12372D]/55">DOB</dt>
            <dd className="col-span-2">
              {c.date_of_birth
                ? new Date(c.date_of_birth).toLocaleDateString('en-MY')
                : '—'}
            </dd>
            <dt className="col-span-1 text-[#12372D]/55">Gender</dt>
            <dd className="col-span-2 capitalize">{c.gender ?? '—'}</dd>
            <dt className="col-span-1 text-[#12372D]/55">Language</dt>
            <dd className="col-span-2 uppercase">{c.language ?? 'EN'}</dd>
            <dt className="col-span-1 text-[#12372D]/55">Dosha</dt>
            <dd className="col-span-2 capitalize">{quiz?.prakriti_primary ?? '—'}</dd>
          </dl>
          {c.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {c.tags.map((t: string) => (
                <span
                  key={t}
                  className="rounded-full border border-[#006B3C]/15 bg-[#EDF4E7]/40 px-2 py-0.5 text-[10.5px]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </article>

        {/* Wellness snapshot */}
        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Wellness snapshot
          </h2>
          <dl className="mt-3 grid grid-cols-3 gap-y-2 text-[12.5px]">
            <dt className="col-span-1 text-[#12372D]/55">Height</dt>
            <dd className="col-span-2">{c.height_cm ? `${c.height_cm} cm` : '—'}</dd>
            <dt className="col-span-1 text-[#12372D]/55">Weight</dt>
            <dd className="col-span-2">{c.weight_kg ? `${c.weight_kg} kg` : '—'}</dd>
            <dt className="col-span-1 text-[#12372D]/55">Allergies</dt>
            <dd className="col-span-2">{c.allergies ?? '—'}</dd>
            <dt className="col-span-1 text-[#12372D]/55">Medications</dt>
            <dd className="col-span-2">{c.current_medications ?? '—'}</dd>
            <dt className="col-span-1 text-[#12372D]/55">Conditions</dt>
            <dd className="col-span-2">{c.medical_conditions ?? '—'}</dd>
          </dl>
        </article>

        {/* Addresses */}
        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Addresses ({addresses.length})
          </h2>
          {addresses.length === 0 ? (
            <p className="mt-2 text-[11.5px] italic text-[#12372D]/55">No saved addresses.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2 text-[12px]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {addresses.map((a: any) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-[#006B3C]/8 bg-[#EDF4E7]/20 p-2"
                >
                  <p className="font-semibold">
                    {a.label} {a.is_default ? '· default' : ''}
                  </p>
                  <p className="text-[#12372D]/65">
                    {a.recipient} · {a.phone}
                  </p>
                  <p className="text-[#12372D]/65">
                    {a.line1}, {a.city} {a.postcode}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* Orders + appointments + tickets + vouchers */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Order history ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="mt-2 text-[11.5px] italic text-[#12372D]/55">No orders yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[#006B3C]/6 text-[12.5px]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {orders.slice(0, 8).map((o: any) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                  >
                    #{String(o.id).slice(-6).toUpperCase()}
                  </Link>
                  <span className="text-[#12372D]/65">
                    RM {Number(o.total_amount_rm).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[#12372D]/55">
                    {o.fulfillment_status}
                  </span>
                  <span className="text-[11px] text-[#12372D]/55">
                    {new Date(o.created_at).toLocaleDateString('en-MY')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Vouchers in wallet ({vouchers.length})
          </h2>
          {vouchers.length === 0 ? (
            <p className="mt-2 text-[11.5px] italic text-[#12372D]/55">
              No vouchers granted yet. Use &quot;Push voucher&quot; above to send one.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[#006B3C]/6 text-[12.5px]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {vouchers.slice(0, 8).map((v: any) => {
                const p = Array.isArray(v.promo) ? v.promo[0] : v.promo
                return (
                  <li key={v.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-semibold text-[#006B3C]">
                        {p?.title ?? 'Voucher'}
                      </p>
                      <p className="text-[11px] text-[#12372D]/55">
                        {p?.code} · {v.source} · {v.status}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#12372D]/55">
                      {new Date(v.granted_at).toLocaleDateString('en-MY')}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Appointments ({appointments.length})
          </h2>
          {appointments.length === 0 ? (
            <p className="mt-2 text-[11.5px] italic text-[#12372D]/55">No appointments.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[#006B3C]/6 text-[12.5px]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {appointments.slice(0, 8).map((a: any) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>
                    {new Date(a.appointment_date_time).toLocaleString('en-MY')}
                  </span>
                  <span className="text-[11px] text-[#12372D]/55 capitalize">
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Support tickets ({tickets.length})
          </h2>
          {tickets.length === 0 ? (
            <p className="mt-2 text-[11.5px] italic text-[#12372D]/55">No tickets.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[#006B3C]/6 text-[12.5px]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {tickets.slice(0, 8).map((t: any) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <span className="truncate">{t.subject}</span>
                  <span className="text-[11px] text-[#12372D]/55 capitalize">
                    {t.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <InternalNotesPanel customerId={c.id} initial={c.internal_notes} />
    </div>
  )
}
