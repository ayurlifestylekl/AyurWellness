import { Check, X } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type PaymentStatus = Database['public']['Tables']['orders']['Row']['payment_status']
type FulfillmentStatus = Database['public']['Tables']['orders']['Row']['fulfillment_status']

interface OrderTimelineProps {
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
}

type StepState = 'done' | 'current' | 'future'

interface Step {
  label: string
  state: StepState
}

function deriveSteps(
  payment: PaymentStatus,
  fulfillment: FulfillmentStatus
): Step[] {
  // Cancelled / failed payment short-circuits the linear timeline — caller
  // renders a separate cancelled pill instead. We still derive a sensible
  // 5-step view here in case caller renders this for any state.
  const paid = payment === 'paid'
  const processing = fulfillment === 'processing' || fulfillment === 'shipped' || fulfillment === 'delivered'
  const shipped = fulfillment === 'shipped' || fulfillment === 'delivered'
  const delivered = fulfillment === 'delivered'

  const steps: Step[] = [
    { label: 'Placed', state: 'done' }, // every order is at least placed
    { label: 'Paid', state: paid ? 'done' : payment === 'pending' ? 'current' : 'future' },
    { label: 'Processing', state: delivered || shipped ? 'done' : processing ? 'current' : 'future' },
    { label: 'Shipped', state: delivered ? 'done' : shipped ? 'current' : 'future' },
    { label: 'Delivered', state: delivered ? 'done' : 'future' },
  ]
  return steps
}

const STEP_DOT: Record<StepState, string> = {
  done:    'bg-[#006B3C] text-white',
  current: 'bg-[#B58A3B] text-[#12372D] ring-4 ring-[#B58A3B]/20',
  future:  'bg-[#006B3C]/[0.08] text-[#006B3C]/35',
}

const STEP_LABEL: Record<StepState, string> = {
  done:    'text-[#006B3C]',
  current: 'text-[#006B3C]',
  future:  'text-[#006B3C]/35',
}

const CONNECTOR: Record<'done' | 'next', string> = {
  done: 'bg-[#006B3C]',
  next: 'bg-[#006B3C]/[0.10]',
}

export default function OrderTimeline({
  paymentStatus,
  fulfillmentStatus,
}: OrderTimelineProps) {
  // Cancelled state — show single red pill, not a stepper
  if (paymentStatus === 'failed') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-400/40 bg-red-50/60 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
          <X className="h-4 w-4 text-red-600" strokeWidth={2.2} />
        </span>
        <div>
          <p className="font-heading text-[13px] font-semibold text-red-700">
            Order cancelled
          </p>
          <p className="font-body text-[11.5px] text-red-700/70">
            Payment did not go through. Contact us for help.
          </p>
        </div>
      </div>
    )
  }

  const steps = deriveSteps(paymentStatus, fulfillmentStatus)

  return (
    <section
      className="rounded-3xl border border-[#006B3C]/8 bg-white p-5 sm:p-6"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      {/* Desktop / tablet — horizontal */}
      <ol className="hidden items-start gap-0 sm:flex">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const nextDone = !isLast && steps[i + 1].state === 'done'
          return (
            <li key={step.label} className="flex flex-1 items-start gap-2">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-heading text-[11px] font-bold transition-all ${STEP_DOT[step.state]}`}
                >
                  {step.state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                <span
                  className={`mt-2 whitespace-nowrap font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] ${STEP_LABEL[step.state]}`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={`mt-[15px] h-px flex-1 ${nextDone ? CONNECTOR.done : CONNECTOR.next}`}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile — vertical */}
      <ol className="flex flex-col gap-3 sm:hidden">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          return (
            <li key={step.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-heading text-[10px] font-bold transition-all ${STEP_DOT[step.state]}`}
                >
                  {step.state === 'done' ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
                </span>
                {!isLast && <span className="h-5 w-px bg-[#006B3C]/[0.10]" />}
              </div>
              <span
                className={`pt-1 font-heading text-[12px] font-semibold ${STEP_LABEL[step.state]}`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
