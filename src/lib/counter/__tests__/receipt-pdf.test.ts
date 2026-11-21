import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import * as React from 'react'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import BillReceiptDocument from '../BillReceiptDocument'
import type { Bill } from '../queries'

const bill: Bill = {
  id: '00000000-0000-4000-8000-000000000001',
  billNo: 42,
  status: 'paid',
  patientId: null,
  appointmentId: null,
  customerName: 'Sample Customer',
  customerPhone: '012-000 0101',
  discountRm: 22.7,
  subtotalRm: 222.8,
  totalRm: 200.1,
  paymentMethod: 'cash',
  amountReceivedRm: 250,
  notes: null,
  paidAt: '2026-11-22T07:30:00.000Z',
  createdAt: '2026-11-22T07:00:00.000Z',
  paidByName: 'Front Desk',
  items: [
    { id: 'a', kind: 'service', treatmentId: null, productId: null, packagePurchaseId: null, description: 'Abhyangam (Full Body Oil Massage)', quantity: 1, unitPriceRm: 145, lineTotalRm: 145 },
    { id: 'b', kind: 'product', treatmentId: null, productId: 'p', packagePurchaseId: null, description: 'Dhanwantharam Thailam 200ml', quantity: 2, unitPriceRm: 38.9, lineTotalRm: 77.8 },
    { id: 'c', kind: 'package', treatmentId: null, productId: null, packagePurchaseId: 'k', description: 'Abhyangam Package — session redeemed', quantity: 1, unitPriceRm: 0, lineTotalRm: 0 },
  ],
}

// The test runner compiles JSX the classic way (React.createElement); the app build doesn't need this.
;(globalThis as { React?: typeof React }).React = React

describe('counter receipt PDF', () => {
  it('renders a one-page A4 receipt', async () => {
    const buf = await renderToBuffer(createElement(BillReceiptDocument, { bill, patientNo: 'KAL-00012' }) as Parameters<typeof renderToBuffer>[0])
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buf.toString('latin1').match(/\/Type \/Page\b/g)?.length).toBe(1)
    if (process.env.RECEIPT_PDF_OUT) writeFileSync(process.env.RECEIPT_PDF_OUT, buf)
  }, 30000)
})
