/**
 * Demo-only mock orders. Shown to the demo-admin account when no real
 * orders exist in the database, so the screens render populated. These
 * values never touch Supabase — they are returned in-memory from the
 * server component to make the demo feel real.
 *
 * IDs are deterministic UUID-shaped strings so the detail route can
 * recognise them and return the matching detail mock.
 */
import type { AdminOrderListItem } from './queries'

export const DEMO_ADMIN_EMAIL = 'demo-admin@kerala-ayurvedic.dev'

export function isMockOrderId(id: string): boolean {
  return id.startsWith('00000000-mock-')
}

// helper: format a date N days ago
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const MOCK_ORDER_LIST: AdminOrderListItem[] = [
  {
    id: '00000000-mock-0001-aaaa-000000000001',
    shortId: 'A00001',
    customerName: 'Aisha Rahman',
    customerEmail: 'aisha.rahman@example.com',
    totalRm: 245.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'packing',
    channel: 'web',
    trackingNumber: null,
    createdAt: daysAgo(0),
    itemCount: 3,
  },
  {
    id: '00000000-mock-0002-aaaa-000000000002',
    shortId: 'A00002',
    customerName: 'Priya Nair',
    customerEmail: 'priya.nair@example.com',
    totalRm: 180.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    channel: 'web',
    trackingNumber: 'PL456789012MY',
    createdAt: daysAgo(2),
    itemCount: 1,
  },
  {
    id: '00000000-mock-0003-aaaa-000000000003',
    shortId: 'A00003',
    customerName: 'Wei Ming Tan',
    customerEmail: 'weiming.tan@example.com',
    totalRm: 95.0,
    paymentStatus: 'pending',
    fulfillmentStatus: 'pending',
    channel: 'web',
    trackingNumber: null,
    createdAt: daysAgo(1),
    itemCount: 2,
  },
  {
    id: '00000000-mock-0004-aaaa-000000000004',
    shortId: 'A00004',
    customerName: 'David Lee',
    customerEmail: 'david.lee@example.com',
    totalRm: 425.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    channel: 'web',
    trackingNumber: 'JT0089234561',
    createdAt: daysAgo(5),
    itemCount: 4,
  },
  {
    id: '00000000-mock-0005-aaaa-000000000005',
    shortId: 'A00005',
    customerName: 'Siti Hasan',
    customerEmail: 'siti.hasan@example.com',
    totalRm: 60.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'completed',
    channel: 'walk_in',
    trackingNumber: null,
    createdAt: daysAgo(7),
    itemCount: 1,
  },
  {
    id: '00000000-mock-0006-aaaa-000000000006',
    shortId: 'A00006',
    customerName: 'Hassan Ibrahim',
    customerEmail: 'hassan.ibrahim@example.com',
    totalRm: 120.0,
    paymentStatus: 'refunded',
    fulfillmentStatus: 'cancelled',
    channel: 'web',
    trackingNumber: null,
    createdAt: daysAgo(10),
    itemCount: 1,
  },
  {
    id: '00000000-mock-0007-aaaa-000000000007',
    shortId: 'A00007',
    customerName: 'Lakshmi Devi',
    customerEmail: 'lakshmi.devi@example.com',
    totalRm: 310.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'processing',
    channel: 'phone',
    trackingNumber: null,
    createdAt: daysAgo(0),
    itemCount: 2,
  },
  {
    id: '00000000-mock-0008-aaaa-000000000008',
    shortId: 'A00008',
    customerName: 'Mohan Krishnan',
    customerEmail: 'mohan.k@example.com',
    totalRm: 75.0,
    paymentStatus: 'pending',
    fulfillmentStatus: 'pending',
    channel: 'web',
    trackingNumber: null,
    createdAt: daysAgo(3),
    itemCount: 1,
  },
]

// ───────────────────────────────────────────────────────────────────────
// Detail mocks
// ───────────────────────────────────────────────────────────────────────

interface MockProduct {
  id: string
  name: string
  sku: string
  image_url: string | null
  category: string | null
}

const PRODUCTS: Record<string, MockProduct> = {
  P01: { id: 'mock-p-01', name: 'Kesha Thailam Hair Oil', sku: 'KAL-KESH-100', image_url: null, category: 'Haircare' },
  P02: { id: 'mock-p-02', name: 'Neelibhringadi Oil', sku: 'KAL-NEEL-200', image_url: null, category: 'Haircare' },
  P03: { id: 'mock-p-03', name: 'Kumkumadi Serum', sku: 'KAL-KUMK-30', image_url: null, category: 'Skincare' },
  P04: { id: 'mock-p-04', name: 'Brahmi Capsules', sku: 'KAL-BRAH-60', image_url: null, category: 'Wellness' },
  P05: { id: 'mock-p-05', name: 'Triphala Churna', sku: 'KAL-TRPH-100', image_url: null, category: 'Wellness' },
  P06: { id: 'mock-p-06', name: 'Ashwagandha Tablets', sku: 'KAL-ASHW-90', image_url: null, category: 'Wellness' },
}

const ADDRESSES = {
  KL: {
    line1: '12-3 Jalan Telawi 3', line2: 'Bangsar Baru',
    city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', postcode: '59100', country: 'Malaysia',
  },
  PJ: {
    line1: '88 Jalan SS2/24', line2: null,
    city: 'Petaling Jaya', state: 'Selangor', postcode: '47300', country: 'Malaysia',
  },
  PG: {
    line1: '15 Lebuh Pantai', line2: 'George Town',
    city: 'Pulau Pinang', state: 'Penang', postcode: '10300', country: 'Malaysia',
  },
  JB: {
    line1: '22 Jalan Tebrau', line2: null,
    city: 'Johor Bahru', state: 'Johor', postcode: '80300', country: 'Malaysia',
  },
}

/**
 * Returns a synthetic full-detail object matching the shape of
 * getAdminOrderById's return value. Only called for IDs that pass
 * isMockOrderId().
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMockOrderDetail(id: string): any | null {
  const list = MOCK_ORDER_LIST.find((o) => o.id === id)
  if (!list) return null

  const detailMap: Record<string, () => Record<string, unknown>> = {
    '00000000-mock-0001-aaaa-000000000001': () => ({
      customer: {
        id: 'mock-c-01',
        full_name: 'Aisha Rahman',
        email: 'aisha.rahman@example.com',
        phone_number: '+60 12-345 6789',
      },
      shipping_address: ADDRESSES.KL,
      billing_address: ADDRESSES.KL,
      practitioner_note: null,
      internal_notes: null,
      tracking_number: null,
      courier_service: null,
      invoice_number: 'INV-2026-00012',
      order_items: [
        { id: 'i-1', product_id: PRODUCTS.P01.id, product: PRODUCTS.P01, quantity: 1, price_at_purchase_rm: 85 },
        { id: 'i-2', product_id: PRODUCTS.P03.id, product: PRODUCTS.P03, quantity: 1, price_at_purchase_rm: 80 },
        { id: 'i-3', product_id: PRODUCTS.P04.id, product: PRODUCTS.P04, quantity: 1, price_at_purchase_rm: 80 },
      ],
      events: [
        { id: 'e-1', event_type: 'status_change', from_status: 'processing', to_status: 'packing', payload: {}, is_customer_visible: true, created_at: daysAgo(0) },
        { id: 'e-2', event_type: 'status_change', from_status: 'pending', to_status: 'processing', payload: {}, is_customer_visible: true, created_at: daysAgo(0) },
        { id: 'e-3', event_type: 'payment_received', from_status: null, to_status: null, payload: { method: 'billplz' }, is_customer_visible: true, created_at: daysAgo(0) },
      ],
      refunds: [],
    }),
    '00000000-mock-0002-aaaa-000000000002': () => ({
      customer: {
        id: 'mock-c-02', full_name: 'Priya Nair', email: 'priya.nair@example.com', phone_number: '+60 12-987 6543',
      },
      shipping_address: ADDRESSES.PJ,
      billing_address: ADDRESSES.PJ,
      practitioner_note: 'Use Neelibhringadi oil 3× per week — apply 20 minutes before shower.',
      internal_notes: 'Repeat customer, prefers WhatsApp updates.',
      tracking_number: 'PL456789012MY',
      courier_service: 'Pos Laju',
      invoice_number: 'INV-2026-00011',
      order_items: [
        { id: 'i-1', product_id: PRODUCTS.P02.id, product: PRODUCTS.P02, quantity: 1, price_at_purchase_rm: 180 },
      ],
      events: [
        { id: 'e-1', event_type: 'status_change', from_status: 'packing', to_status: 'shipped', payload: {}, is_customer_visible: true, created_at: daysAgo(1) },
        { id: 'e-2', event_type: 'tracking_added', from_status: null, to_status: null, payload: { carrier: 'Pos Laju', tracking_number: 'PL456789012MY' }, is_customer_visible: true, created_at: daysAgo(1) },
        { id: 'e-3', event_type: 'practitioner_note_added', from_status: null, to_status: null, payload: { note: 'Use Neelibhringadi oil 3× per week.' }, is_customer_visible: true, created_at: daysAgo(2) },
        { id: 'e-4', event_type: 'payment_received', from_status: null, to_status: null, payload: { method: 'billplz' }, is_customer_visible: true, created_at: daysAgo(2) },
      ],
      refunds: [],
    }),
    '00000000-mock-0003-aaaa-000000000003': () => ({
      customer: {
        id: 'mock-c-03', full_name: 'Wei Ming Tan', email: 'weiming.tan@example.com', phone_number: '+60 16-234 5678',
      },
      shipping_address: ADDRESSES.PG,
      billing_address: ADDRESSES.PG,
      practitioner_note: null,
      internal_notes: 'New customer — first order.',
      tracking_number: null,
      courier_service: null,
      invoice_number: null,
      order_items: [
        { id: 'i-1', product_id: PRODUCTS.P04.id, product: PRODUCTS.P04, quantity: 1, price_at_purchase_rm: 45 },
        { id: 'i-2', product_id: PRODUCTS.P05.id, product: PRODUCTS.P05, quantity: 1, price_at_purchase_rm: 50 },
      ],
      events: [],
      refunds: [],
    }),
    '00000000-mock-0004-aaaa-000000000004': () => ({
      customer: {
        id: 'mock-c-04', full_name: 'David Lee', email: 'david.lee@example.com', phone_number: '+60 19-876 5432',
      },
      shipping_address: ADDRESSES.JB,
      billing_address: ADDRESSES.JB,
      practitioner_note: null,
      internal_notes: null,
      tracking_number: 'JT0089234561',
      courier_service: 'J&T Express',
      invoice_number: 'INV-2026-00010',
      order_items: [
        { id: 'i-1', product_id: PRODUCTS.P01.id, product: PRODUCTS.P01, quantity: 2, price_at_purchase_rm: 85 },
        { id: 'i-2', product_id: PRODUCTS.P03.id, product: PRODUCTS.P03, quantity: 1, price_at_purchase_rm: 180 },
        { id: 'i-3', product_id: PRODUCTS.P06.id, product: PRODUCTS.P06, quantity: 1, price_at_purchase_rm: 60 },
        { id: 'i-4', product_id: PRODUCTS.P05.id, product: PRODUCTS.P05, quantity: 1, price_at_purchase_rm: 15 },
      ],
      events: [
        { id: 'e-1', event_type: 'status_change', from_status: 'shipped', to_status: 'delivered', payload: {}, is_customer_visible: true, created_at: daysAgo(1) },
        { id: 'e-2', event_type: 'tracking_added', from_status: null, to_status: null, payload: { carrier: 'J&T Express', tracking_number: 'JT0089234561' }, is_customer_visible: true, created_at: daysAgo(3) },
        { id: 'e-3', event_type: 'payment_received', from_status: null, to_status: null, payload: { method: 'billplz' }, is_customer_visible: true, created_at: daysAgo(5) },
      ],
      refunds: [],
    }),
    '00000000-mock-0005-aaaa-000000000005': () => ({
      customer: {
        id: 'mock-c-05', full_name: 'Siti Hasan', email: 'siti.hasan@example.com', phone_number: '+60 13-111 2222',
      },
      shipping_address: null,
      billing_address: null,
      practitioner_note: null,
      internal_notes: 'Walk-in customer at Brickfields clinic.',
      tracking_number: null,
      courier_service: 'Self-Pickup',
      invoice_number: 'INV-2026-00009',
      order_items: [
        { id: 'i-1', product_id: PRODUCTS.P06.id, product: PRODUCTS.P06, quantity: 1, price_at_purchase_rm: 60 },
      ],
      events: [
        { id: 'e-1', event_type: 'status_change', from_status: 'delivered', to_status: 'completed', payload: {}, is_customer_visible: true, created_at: daysAgo(6) },
        { id: 'e-2', event_type: 'payment_received', from_status: null, to_status: null, payload: { method: 'cash' }, is_customer_visible: true, created_at: daysAgo(7) },
      ],
      refunds: [],
    }),
    '00000000-mock-0006-aaaa-000000000006': () => ({
      customer: {
        id: 'mock-c-06', full_name: 'Hassan Ibrahim', email: 'hassan.ibrahim@example.com', phone_number: '+60 18-333 4444',
      },
      shipping_address: ADDRESSES.KL,
      billing_address: ADDRESSES.KL,
      practitioner_note: null,
      internal_notes: 'Customer requested cancellation — change of mind.',
      tracking_number: null,
      courier_service: null,
      invoice_number: 'INV-2026-00008',
      order_items: [
        { id: 'i-1', product_id: PRODUCTS.P02.id, product: PRODUCTS.P02, quantity: 1, price_at_purchase_rm: 120 },
      ],
      events: [
        { id: 'e-1', event_type: 'refund_recorded', from_status: null, to_status: null, payload: { amount_rm: 120, reason: 'Customer requested refund — change of mind.', full: true }, is_customer_visible: true, created_at: daysAgo(8) },
        { id: 'e-2', event_type: 'status_change', from_status: 'processing', to_status: 'cancelled', payload: {}, is_customer_visible: true, created_at: daysAgo(8) },
        { id: 'e-3', event_type: 'payment_received', from_status: null, to_status: null, payload: { method: 'billplz' }, is_customer_visible: true, created_at: daysAgo(10) },
      ],
      refunds: [
        { id: 'r-1', amount_rm: 120, reason: 'Customer requested refund — change of mind.', refund_method: 'billplz', gateway_reference: 'BPLZ-REFUND-882341', created_at: daysAgo(8) },
      ],
    }),
    '00000000-mock-0007-aaaa-000000000007': () => ({
      customer: {
        id: 'mock-c-07', full_name: 'Lakshmi Devi', email: 'lakshmi.devi@example.com', phone_number: '+60 14-555 6666',
      },
      shipping_address: ADDRESSES.KL,
      billing_address: ADDRESSES.KL,
      practitioner_note: 'Twice-daily dose recommended for first 2 weeks.',
      internal_notes: null,
      tracking_number: null,
      courier_service: null,
      invoice_number: 'INV-2026-00013',
      order_items: [
        { id: 'i-1', product_id: PRODUCTS.P03.id, product: PRODUCTS.P03, quantity: 1, price_at_purchase_rm: 180 },
        { id: 'i-2', product_id: PRODUCTS.P02.id, product: PRODUCTS.P02, quantity: 1, price_at_purchase_rm: 130 },
      ],
      events: [
        { id: 'e-1', event_type: 'status_change', from_status: 'pending', to_status: 'processing', payload: {}, is_customer_visible: true, created_at: daysAgo(0) },
        { id: 'e-2', event_type: 'payment_received', from_status: null, to_status: null, payload: { method: 'bank_transfer' }, is_customer_visible: true, created_at: daysAgo(0) },
      ],
      refunds: [],
    }),
    '00000000-mock-0008-aaaa-000000000008': () => ({
      customer: {
        id: 'mock-c-08', full_name: 'Mohan Krishnan', email: 'mohan.k@example.com', phone_number: '+60 17-777 8888',
      },
      shipping_address: ADDRESSES.PJ,
      billing_address: ADDRESSES.PJ,
      practitioner_note: null,
      internal_notes: null,
      tracking_number: null,
      courier_service: null,
      invoice_number: null,
      order_items: [
        { id: 'i-1', product_id: PRODUCTS.P04.id, product: PRODUCTS.P04, quantity: 1, price_at_purchase_rm: 75 },
      ],
      events: [],
      refunds: [],
    }),
  }

  const builder = detailMap[id]
  if (!builder) return null

  return {
    id,
    customer_id: 'mock-cust-id',
    total_amount_rm: list.totalRm,
    payment_status: list.paymentStatus,
    fulfillment_status: list.fulfillmentStatus,
    channel: list.channel,
    created_at: list.createdAt,
    cancelled_at: list.fulfillmentStatus === 'cancelled' ? list.createdAt : null,
    cancel_reason: list.fulfillmentStatus === 'cancelled' ? 'Customer requested cancellation.' : null,
    referral_agent_id: null,
    payment_method: list.paymentStatus === 'paid' ? 'billplz' : null,
    subtotal_rm: list.totalRm,
    tax_amount_rm: 0,
    shipping_amount_rm: 0,
    discount_amount_rm: 0,
    discount_code: null,
    paid_at: list.paymentStatus === 'paid' ? list.createdAt : null,
    shipped_at: list.fulfillmentStatus === 'shipped' || list.fulfillmentStatus === 'delivered' ? list.createdAt : null,
    delivered_at: list.fulfillmentStatus === 'delivered' || list.fulfillmentStatus === 'completed' ? list.createdAt : null,
    completed_at: list.fulfillmentStatus === 'completed' ? list.createdAt : null,
    created_by_admin_id: null,
    ...builder(),
  }
}
