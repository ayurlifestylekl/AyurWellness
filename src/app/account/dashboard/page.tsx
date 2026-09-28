import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Clock,
  Compass,
  CreditCard,
  Leaf,
  MapPin,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getLastCompletedVisit, getUpcomingAppointments, type AppointmentRow } from '@/lib/dashboard/queries'
import { getTipOfDay } from '@/lib/dashboard/wellness-tips'
import { getLatestResult } from '@/lib/quizzes/queries'
import { getLatestClinicMessage } from '@/lib/support/queries'
import { previewBody, relativeTime } from '@/lib/support/format'
import { listCustomerProductOrders } from '@/lib/product-management/queries'
import { prakritiQuiz } from '@/data/quizzes/prakriti'
import { CLINIC_MAPS_URL, CLINIC_WHATSAPP } from '@/lib/clinic'

export const metadata = { title: 'My Wellness' }
export const dynamic = 'force-dynamic'

const TZ = 'Asia/Kuala_Lumpur'
const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-MY', { timeZone: TZ, ...o }).format(new Date(d))

function klGreeting() {
  const h = Number(new Intl.DateTimeFormat('en-MY', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date()))
  if (h < 5) return 'Rest well'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const CARD = 'rounded-[26px] border'
const CARD_SHADOW = { boxShadow: '0 1px 2px rgba(18,55,45,0.05), 0 26px 50px -34px rgba(60,45,20,0.45)' }
const TINT = {
  sage: 'border-[#006B3C]/10 bg-gradient-to-br from-[#E6EEDF] to-[#F3F1E6]',
  parchment: 'border-[#B58A3B]/25 bg-gradient-to-br from-[#F8EED8] to-[#FBF6EA]',
  mint: 'border-[#006B3C]/10 bg-gradient-to-br from-[#E2ECE3] to-[#F1F4EC]',
  sand: 'border-[#B58A3B]/15 bg-gradient-to-br from-[#F4ECDD] to-[#FAF6EE]',
}

export default async function AccountDashboardPage() {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''
  const firstName = me?.profile.full_name?.split(' ')[0] ?? 'there'
  const supabase = await createClient()

  const [upcoming, lastVisit, prakriti, latestMessage, orders] = await Promise.all([
    getUpcomingAppointments(supabase, customerId, 3),
    getLastCompletedVisit(supabase, customerId),
    getLatestResult(supabase, customerId, 'prakriti'),
    getLatestClinicMessage(supabase, customerId),
    customerId ? listCustomerProductOrders(customerId, me?.identifier ?? '') : Promise.resolve([]),
  ])

  const next = upcoming[0] ?? null
  const archetype = prakriti ? prakritiQuiz.archetypes[prakriti.result.archetypeKey] : null
  const tip = getTipOfDay()

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* ── Welcome ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[30px] text-white" style={{ boxShadow: '0 30px 60px -36px rgba(18,55,45,0.8)' }}>
        <Image src="/hero-shirodhara.jpg" alt="" fill priority sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover object-[65%_center]" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0D2A22]/95 via-[#12372D]/80 to-[#12372D]/20" />
        <span aria-hidden className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#E4C384]/70 to-transparent" />
        <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:p-11">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E4C384]/35 bg-white/10 px-3 py-1 font-heading text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E4C384] backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {fmt(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <h1 className="mt-4 font-heading text-[30px] font-bold leading-[1.08] sm:text-[42px]" style={{ letterSpacing: '-0.025em' }}>
              {klGreeting()},
              <span className="block font-display font-normal italic text-[#E4C384]">{firstName}.</span>
            </h1>
            <figure className="mt-5 max-w-xl border-l-2 border-[#E4C384]/60 pl-4">
              <blockquote className="font-display text-[15px] italic leading-relaxed text-white/85 sm:text-[16.5px]">“{tip.quote}”</blockquote>
              {tip.attribution && (
                <figcaption className="mt-1.5 font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">— {tip.attribution}</figcaption>
              )}
            </figure>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
            {next ? (
              <>
                <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E4C384]">Your next visit</p>
                <p className="mt-2 font-heading text-[17px] font-semibold leading-snug">{next.treatment_name ?? 'Consultation'}</p>
                <p className="mt-1 font-body text-[13px] text-white/75">
                  {fmt(next.appointment_date_time, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmt(next.appointment_date_time, { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </>
            ) : (
              <>
                <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E4C384]">Begin your journey</p>
                <p className="mt-2 font-body text-[13.5px] leading-relaxed text-white/80">
                  A consultation with our Vaidya is the best first step — we&apos;ll read your constitution and shape a plan for you.
                </p>
                <Link
                  href="/book/consultation"
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-[#E4C384] to-[#B58A3B] px-4 font-heading text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#12372D] hover:brightness-105"
                >
                  Book a consultation <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Next visit + Dosha ──────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr] lg:gap-6">
        {next ? <NextVisitCard appt={next} more={upcoming.length - 1} /> : <FirstVisitCard />}
        <DoshaCard
          archetype={archetype}
          scores={prakriti?.result.scores ?? null}
        />
      </div>

      {/* ── Quick actions ───────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Action href="/book/treatment" icon={Leaf} title="Book a treatment" sub="Abhyanga, Shirodhara & more" tone="bg-[#12372D] text-white" chip="bg-white/10 text-[#E4C384]" subTone="text-white/60" />
        <Action href="/book/consultation" icon={Stethoscope} title="See a Vaidya" sub="Personal consultation" tone="bg-gradient-to-br from-[#E9D6AE] to-[#F4E8CC] text-[#12372D]" chip="bg-white/60 text-[#8A6420]" subTone="text-[#12372D]/55" />
        <Action href={`https://wa.me/${CLINIC_WHATSAPP}`} icon={MessageCircle} title="WhatsApp us" sub="Quick questions" external tone="bg-gradient-to-br from-[#D7E6D4] to-[#EAF1E5] text-[#12372D]" chip="bg-white/60 text-[#006B3C]" subTone="text-[#12372D]/55" />
        <Action href="/products" icon={ShoppingBag} title="Our remedies" sub="Herbal oils & care" tone="bg-gradient-to-br from-[#EBDDC9] to-[#F6EEE2] text-[#12372D]" chip="bg-white/60 text-[#8A5A3B]" subTone="text-[#12372D]/55" />
      </section>

      {/* ── Care notes + messages ───────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section className={`${CARD} ${TINT.parchment} relative overflow-hidden p-6 sm:p-7`} style={CARD_SHADOW}>
          <Leaf aria-hidden className="absolute -bottom-6 -right-6 h-32 w-32 rotate-12 text-[#B58A3B]/10" strokeWidth={1} />
          <Eyebrow icon={Leaf}>From your Vaidya</Eyebrow>
          {lastVisit?.notes ? (
            <>
              <p className="mt-4 font-display text-[17px] italic leading-relaxed text-[#12372D]/85">“{lastVisit.notes}”</p>
              <p className="mt-3 font-body text-[12.5px] text-[#12372D]/50">
                After your {lastVisit.treatment_name ?? 'visit'} · {fmt(lastVisit.appointment_date_time, { day: 'numeric', month: 'long' })}
              </p>
            </>
          ) : (
            <p className="mt-4 font-body text-[14px] leading-relaxed text-[#12372D]/60">
              After each visit, your Vaidya&apos;s personal advice — diet, routine and home care — will appear here so it&apos;s always close at hand.
            </p>
          )}
        </section>

        <Link href={latestMessage ? `/account/messages/${latestMessage.ticket.id}` : '/account/messages'} className={`group ${CARD} ${TINT.mint} flex flex-col p-6 transition hover:-translate-y-0.5 hover:border-[#B58A3B]/35 sm:p-7`} style={CARD_SHADOW}>
          <div className="flex items-center justify-between">
            <Eyebrow icon={MessageCircle}>Messages</Eyebrow>
            {latestMessage?.ticket.unread_by_customer && (
              <span className="rounded-full bg-[#B58A3B] px-2.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-[0.12em] text-white">New</span>
            )}
          </div>
          {latestMessage ? (
            <>
              <p className="mt-4 font-heading text-[15px] font-semibold text-[#12372D]">{latestMessage.ticket.subject}</p>
              <p className="mt-1.5 line-clamp-2 font-body text-[13.5px] leading-relaxed text-[#12372D]/60">{previewBody(latestMessage.message.body, 160)}</p>
              <p className="mt-auto pt-4 font-body text-[12px] text-[#12372D]/45">{relativeTime(latestMessage.message.created_at)}</p>
            </>
          ) : (
            <p className="mt-4 font-body text-[14px] leading-relaxed text-[#12372D]/60">Questions about a treatment or your routine? Send us a note — we reply within a day.</p>
          )}
          <span className="mt-4 inline-flex items-center gap-1.5 font-heading text-[12px] font-semibold text-[#006B3C] group-hover:text-[#B58A3B]">
            Open messages <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      {/* ── Orders ──────────────────────────────────────────────── */}
      <section className={`${CARD} ${TINT.sand} p-6 sm:p-7`} style={CARD_SHADOW}>
        <div className="flex items-center justify-between gap-3">
          <Eyebrow icon={Package}>Your orders</Eyebrow>
          {orders.length > 0 && (
            <Link href="/account/product-orders" className="font-heading text-[12px] font-semibold text-[#006B3C] hover:text-[#B58A3B]">
              View all
            </Link>
          )}
        </div>
        {orders.length === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-white/70 bg-white/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-[14px] text-[#12372D]/65">Our herbal oils and remedies are prepared by hand — they&apos;ll be available to order soon.</p>
            <Link href="/products" className="inline-flex shrink-0 items-center gap-1.5 font-heading text-[12px] font-semibold text-[#006B3C] hover:text-[#B58A3B]">
              Explore remedies <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[#12372D]/[0.06]">
            {orders.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link href={`/account/product-orders/${o.id}`} className="flex items-center justify-between gap-3 py-3.5 hover:text-[#B58A3B]">
                  <div>
                    <p className="font-heading text-[14px] font-semibold text-[#12372D]">{o.order_number}</p>
                    <p className="font-body text-[12.5px] text-[#12372D]/50">
                      {fmt(o.created_at, { day: 'numeric', month: 'short', year: 'numeric' })} · {o.item_count} item{o.item_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-[14px] font-semibold text-[#12372D]">RM {o.total_rm.toFixed(2)}</p>
                    <OrderStatus status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

const VISIT_STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 'bg-[#EDF4E7] text-[#006B3C]' },
  scheduled: { label: 'Confirmed', cls: 'bg-[#EDF4E7] text-[#006B3C]' },
  checked_in: { label: 'Checked in', cls: 'bg-[#EDF4E7] text-[#006B3C]' },
  in_progress: { label: 'In session', cls: 'bg-[#EDF4E7] text-[#006B3C]' },
  pending: { label: 'Awaiting confirmation', cls: 'bg-[#FBF6EC] text-[#8A6420]' },
  awaiting_payment: { label: 'Payment needed', cls: 'bg-[#FBF6EC] text-[#8A6420]' },
}

function NextVisitCard({ appt, more }: { appt: AppointmentRow; more: number }) {
  const status = VISIT_STATUS[appt.status] ?? { label: appt.status.replace(/_/g, ' '), cls: 'bg-[#F1F2EC] text-[#12372D]/70' }
  // The generated types predate the booking system's payment columns.
  const booking = appt as Omit<AppointmentRow, 'status'> & { status: string; payment_url?: string | null }
  const payUrl = booking.status === 'awaiting_payment' ? booking.payment_url ?? null : null
  return (
    <section className={`${CARD} ${TINT.sage} relative flex flex-col overflow-hidden p-6 sm:p-7`} style={CARD_SHADOW}>
      <span aria-hidden className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#E4C384] to-[#B58A3B]" />
      <div className="flex items-center justify-between gap-3">
        <Eyebrow icon={CalendarDays}>Your next visit</Eyebrow>
        <span className={`rounded-full px-3 py-1 font-heading text-[10.5px] font-semibold uppercase tracking-[0.12em] ${status.cls}`}>{status.label}</span>
      </div>
      <div className="mt-5 flex gap-4 sm:gap-5">
        <div className="flex w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#12372D] py-3 text-white">
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E4C384]">{fmt(appt.appointment_date_time, { weekday: 'short' })}</span>
          <span className="font-heading text-[28px] font-bold leading-none">{fmt(appt.appointment_date_time, { day: 'numeric' })}</span>
          <span className="mt-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{fmt(appt.appointment_date_time, { month: 'short' })}</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-[19px] font-bold leading-snug text-[#12372D] sm:text-[22px]" style={{ letterSpacing: '-0.015em' }}>
            {appt.treatment_name ?? 'Consultation'}
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-[13.5px] text-[#12372D]/60">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#B58A3B]" />
              {fmt(appt.appointment_date_time, { hour: 'numeric', minute: '2-digit', hour12: true })}
              {appt.duration_mins ? ` · ${appt.duration_mins} min` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#B58A3B]" />
              Brickfields, KL
            </span>
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2.5">
        {payUrl ? (
          <a href={payUrl} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#12372D] px-5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0E2C24]">
            <CreditCard className="h-4 w-4 text-[#E4C384]" /> Complete payment
          </a>
        ) : (
          <a href={CLINIC_MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#12372D] px-5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0E2C24]">
            <MapPin className="h-4 w-4 text-[#E4C384]" /> Directions
          </a>
        )}
        <Link href="/account/appointments" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#12372D]/12 bg-white/70 px-5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#12372D] hover:border-[#B58A3B]/50">
          Visit details
        </Link>
      </div>
      <div className="mt-6 rounded-2xl border border-white/60 bg-white/55 p-4 sm:p-5">
        <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">Before you come in</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {['Eat lightly 2 hours before', 'Wear loose, comfortable clothing', 'Arrive 15 minutes early to settle', 'Tell us about any new medication'].map((t) => (
            <li key={t} className="flex items-start gap-2 font-body text-[13px] text-[#12372D]/70">
              <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#006B3C]" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      {more > 0 && (
        <p className="mt-4 font-body text-[12.5px] text-[#12372D]/50">
          + {more} more upcoming visit{more === 1 ? '' : 's'}
        </p>
      )}
    </section>
  )
}

function FirstVisitCard() {
  return (
    <section className={`${CARD} ${TINT.sage} flex flex-col justify-between gap-5 p-6 sm:p-7`} style={CARD_SHADOW}>
      <div>
        <Eyebrow icon={CalendarPlus}>Your visits</Eyebrow>
        <h2 className="mt-4 font-heading text-[21px] font-bold leading-snug text-[#12372D]" style={{ letterSpacing: '-0.015em' }}>
          Nothing booked yet.
          <span className="block font-display font-normal italic text-[#B58A3B]">Let&apos;s find what suits you.</span>
        </h2>
        <p className="mt-3 max-w-md font-body text-[14px] leading-relaxed text-[#12372D]/60">
          Start with a consultation, or choose from our traditional treatments — each tailored to your constitution.
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Link href="/book/consultation" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#12372D] px-5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0E2C24]">
          Book consultation
        </Link>
        <Link href="/book/treatment" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#12372D]/12 bg-white px-5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#12372D] hover:border-[#B58A3B]/50">
          Browse treatments
        </Link>
      </div>
    </section>
  )
}

const DOSHA_BARS: { key: 'vata' | 'pitta' | 'kapha'; label: string; color: string }[] = [
  { key: 'vata', label: 'Vata · air', color: '#8FA9B8' },
  { key: 'pitta', label: 'Pitta · fire', color: '#C8793A' },
  { key: 'kapha', label: 'Kapha · earth', color: '#6F8F5A' },
]

function DoshaCard({
  archetype,
  scores,
}: {
  archetype: (typeof prakritiQuiz.archetypes)[keyof typeof prakritiQuiz.archetypes] | null
  scores: { vata: number; pitta: number; kapha: number } | null
}) {
  if (!archetype || !scores) {
    return (
      <section className="relative overflow-hidden rounded-[26px] bg-[#12372D] p-6 text-white sm:p-7" style={{ boxShadow: '0 30px 60px -36px rgba(18,55,45,0.8)' }}>
        <span aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(228,195,132,0.3), transparent 70%)' }} />
        <div className="relative">
          <p className="inline-flex items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#E4C384]">
            <Compass className="h-3.5 w-3.5" /> Your constitution
          </p>
          <h2 className="mt-4 font-heading text-[21px] font-bold leading-snug">
            Discover your dosha.
            <span className="block font-display font-normal italic text-[#E4C384]">Vata, Pitta or Kapha?</span>
          </h2>
          <p className="mt-3 font-body text-[14px] leading-relaxed text-white/70">
            A short Prakriti quiz reveals your nature — and the foods, routines and treatments that keep you in balance.
          </p>
          <Link href="/account/assessments/prakriti" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-b from-[#E4C384] to-[#B58A3B] px-5 font-heading text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#12372D] hover:brightness-105">
            Take the quiz · 5 min <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    )
  }

  const total = Math.max(1, scores.vata + scores.pitta + scores.kapha)
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-[#12372D] p-6 text-white sm:p-7" style={{ boxShadow: '0 30px 60px -36px rgba(18,55,45,0.8)' }}>
      <span aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(228,195,132,0.3), transparent 70%)' }} />
      <div className="relative">
        <p className="inline-flex items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#E4C384]">
          <Compass className="h-3.5 w-3.5" /> Your constitution
        </p>
        <h2 className="mt-4 font-heading text-[24px] font-bold leading-tight">
          {archetype.name}
          <span className="block font-display text-[19px] font-normal italic text-[#E4C384]">{archetype.title}</span>
        </h2>
        <p className="mt-2 font-body text-[13.5px] leading-relaxed text-white/70">{archetype.essence}</p>
        <div className="mt-5 space-y-2.5">
          {DOSHA_BARS.map((b) => {
            const pct = Math.round((scores[b.key] / total) * 100)
            return (
              <div key={b.key}>
                <div className="flex justify-between font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
                  <span>{b.label}</span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-5 rounded-xl bg-white/[0.07] p-3.5">
          <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E4C384]">Today&apos;s ritual</p>
          <p className="mt-1 font-body text-[13px] leading-relaxed text-white/80">{archetype.dailyAnchors[new Date().getDate() % archetype.dailyAnchors.length]}</p>
        </div>
        <Link href="/account/assessments/prakriti/results" className="mt-4 inline-flex items-center gap-1.5 font-heading text-[12px] font-semibold text-[#E4C384] hover:text-white">
          See your full profile <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

function Action({
  href,
  icon: Icon,
  title,
  sub,
  external,
  tone,
  chip,
  subTone,
}: {
  href: string
  icon: LucideIcon
  title: string
  sub: string
  external?: boolean
  tone: string
  chip: string
  subTone: string
}) {
  const cls = `group flex flex-col gap-3 rounded-[24px] border border-white/40 p-4 transition hover:-translate-y-0.5 sm:p-5 ${tone}`
  const body = (
    <>
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${chip}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block font-heading text-[14px] font-semibold">{title}</span>
        <span className={`mt-0.5 block font-body text-[12px] ${subTone}`}>{sub}</span>
      </span>
    </>
  )
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={CARD_SHADOW}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls} style={CARD_SHADOW}>
      {body}
    </Link>
  )
}

function Eyebrow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
      <Icon className="h-3.5 w-3.5" /> {children}
    </p>
  )
}

const ORDER_STATUS: Record<string, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Being prepared',
  processing: 'Being packed',
  shipped: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

function OrderStatus({ status }: { status: string }) {
  return <p className="font-body text-[12px] text-[#12372D]/50">{ORDER_STATUS[status] ?? status}</p>
}
