import { CLINIC_NAME } from '@/lib/clinic'

export function orderConfirmationEmail(input: {
  firstName: string
  orderShortId: string
  totalRm: number
  items: Array<{ name: string; quantity: number }>
  href: string
}) {
  const greeting = `Hi ${input.firstName},`
  const itemsText = input.items.map((i) => `  • ${i.quantity}× ${i.name}`).join('\n')
  const itemsHtml = input.items.map((i) => `<li style="margin:4px 0">${i.quantity}× ${i.name}</li>`).join('')
  const total = `RM ${input.totalRm.toFixed(2)}`
  return {
    subject: `Order #${input.orderShortId} confirmed — ${total}`,
    text: `${greeting}\n\nWe've received your order #${input.orderShortId}.\n\n${itemsText}\n\nTotal: ${total}\n\nTrack it here: ${input.href}\n\nWith warmth,\n${CLINIC_NAME}`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#12372D">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">Order #${input.orderShortId} confirmed</h1>
  <p style="line-height:1.65">${greeting}</p>
  <p style="line-height:1.65">We've received your order. Here's what's on the way:</p>
  <ul style="line-height:1.7;padding-left:20px">${itemsHtml}</ul>
  <p style="margin-top:16px;font-weight:700;font-size:18px">Total: ${total}</p>
  <p style="margin-top:24px"><a href="${input.href}" style="display:inline-block;background:#149447;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Track order</a></p>
  <p style="margin-top:32px;color:#666">With warmth,<br/>${CLINIC_NAME}</p>
</div>`,
  }
}
