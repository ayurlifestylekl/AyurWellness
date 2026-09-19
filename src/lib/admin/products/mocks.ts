/**
 * Demo-only mock products + inventory. Shown to the demo-admin account
 * when no real products exist in the database. Zero DB writes.
 */
import type { ProductListItem, InventoryRow } from './queries'

export const DEMO_ADMIN_EMAIL = 'demo-admin@kerala-ayurvedic.dev'

export function isMockProductId(id: string): boolean {
  return id.startsWith('00000000-mockp-')
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysAhead(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const MOCK_PRODUCT_LIST: ProductListItem[] = [
  {
    id: '00000000-mockp-0001-aaaa-000000000001',
    name: 'Kesha Thailam Hair Oil',
    sku: 'KAL-KESH-100',
    slug: 'kesha-thailam-hair-oil',
    priceRm: 85,
    salePriceRm: null,
    stockQty: 42,
    category: 'Haircare',
    status: 'active',
    featured: true,
    imageUrl: null,
    updatedAt: daysAgo(2),
  },
  {
    id: '00000000-mockp-0002-aaaa-000000000002',
    name: 'Neelibhringadi Oil',
    sku: 'KAL-NEEL-200',
    slug: 'neelibhringadi-oil',
    priceRm: 120,
    salePriceRm: 99,
    stockQty: 3,
    category: 'Haircare',
    status: 'active',
    featured: false,
    imageUrl: null,
    updatedAt: daysAgo(1),
  },
  {
    id: '00000000-mockp-0003-aaaa-000000000003',
    name: 'Kumkumadi Serum',
    sku: 'KAL-KUMK-30',
    slug: 'kumkumadi-serum',
    priceRm: 180,
    salePriceRm: null,
    stockQty: 0,
    category: 'Skincare',
    status: 'active',
    featured: true,
    imageUrl: null,
    updatedAt: daysAgo(5),
  },
  {
    id: '00000000-mockp-0004-aaaa-000000000004',
    name: 'Brahmi Capsules',
    sku: 'KAL-BRAH-60',
    slug: 'brahmi-capsules',
    priceRm: 45,
    salePriceRm: null,
    stockQty: 18,
    category: 'Wellness',
    status: 'active',
    featured: false,
    imageUrl: null,
    updatedAt: daysAgo(7),
  },
  {
    id: '00000000-mockp-0005-aaaa-000000000005',
    name: 'Triphala Churna',
    sku: 'KAL-TRPH-100',
    slug: 'triphala-churna',
    priceRm: 35,
    salePriceRm: null,
    stockQty: 25,
    category: 'Wellness',
    status: 'active',
    featured: false,
    imageUrl: null,
    updatedAt: daysAgo(10),
  },
  {
    id: '00000000-mockp-0006-aaaa-000000000006',
    name: 'Ashwagandha Tablets',
    sku: 'KAL-ASHW-90',
    slug: 'ashwagandha-tablets',
    priceRm: 60,
    salePriceRm: null,
    stockQty: 12,
    category: 'Wellness',
    status: 'active',
    featured: false,
    imageUrl: null,
    updatedAt: daysAgo(3),
  },
  {
    id: '00000000-mockp-0007-aaaa-000000000007',
    name: 'Vata Balance Kit',
    sku: 'KAL-KIT-VATA',
    slug: 'vata-balance-kit',
    priceRm: 280,
    salePriceRm: 250,
    stockQty: 8,
    category: 'Kits',
    status: 'active',
    featured: true,
    imageUrl: null,
    updatedAt: daysAgo(4),
  },
  {
    id: '00000000-mockp-0008-aaaa-000000000008',
    name: 'Chyawanprash (Draft)',
    sku: 'KAL-CHYA-500',
    slug: 'chyawanprash',
    priceRm: 95,
    salePriceRm: null,
    stockQty: 0,
    category: 'Wellness',
    status: 'draft',
    featured: false,
    imageUrl: null,
    updatedAt: daysAgo(0),
  },
]

// Inventory rows mirror products with computed status chips
export const MOCK_INVENTORY: InventoryRow[] = MOCK_PRODUCT_LIST.filter(
  (p) => p.status === 'active',
).map((p) => {
  const threshold = 5
  let status: InventoryRow['status'] = 'healthy'
  if (p.stockQty === 0) status = 'out'
  else if (p.stockQty <= threshold) status = 'low'
  // Mark Neelibhringadi as expiring soon for demo variety
  const expiringSoonProducts = new Set(['00000000-mockp-0002-aaaa-000000000002'])
  const expiryDate = expiringSoonProducts.has(p.id) ? daysAhead(45) : null
  if (expiryDate && status === 'healthy') status = 'expiring'
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    stockQty: p.stockQty,
    lowStockThreshold: null,
    effectiveThreshold: threshold,
    expiryDate,
    imageUrl: p.imageUrl,
    status,
  }
})
