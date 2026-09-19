import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  listInventory,
  listCategoriesInUse,
  type InventoryFilters,
  type InventoryRow,
} from '@/lib/admin/products/queries'
import { DEMO_ADMIN_EMAIL, MOCK_INVENTORY } from '@/lib/admin/products/mocks'
import InventoryFilters_ from './InventoryFilters'
import InventoryTable from './InventoryTable'

function filterMocks(items: InventoryRow[], filters: InventoryFilters): InventoryRow[] {
  return items.filter((r) => {
    if (filters.filter === 'low-stock' && r.status !== 'low') return false
    if (filters.filter === 'out-of-stock' && r.status !== 'out') return false
    if (filters.filter === 'expiring-soon' && r.status !== 'expiring') return false
    if (filters.category && r.category !== filters.category) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const hay = [r.name, r.sku].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export const metadata = { title: 'Inventory · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { q?: string; filter?: string; category?: string }
}

export default async function AdminInventoryPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const filters: InventoryFilters = {
    search: searchParams.q,
    filter: (searchParams.filter as InventoryFilters['filter']) ?? null,
    category: searchParams.category,
    limit: 100,
  }
  const me = await getCurrentUser()
  const [real, categoriesRaw] = await Promise.all([
    listInventory(supabase, filters),
    listCategoriesInUse(supabase),
  ])

  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const showMocks = isDemoAdmin && real.items.length === 0
  const items = showMocks ? filterMocks(MOCK_INVENTORY, filters) : real.items
  const total = showMocks ? items.length : real.total
  const categories =
    showMocks && categoriesRaw.length === 0
      ? Array.from(new Set(MOCK_INVENTORY.map((p) => p.category).filter((c): c is string => !!c)))
      : categoriesRaw

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Stock & Movements
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
          Inventory
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          {total} active SKU{total === 1 ? '' : 's'} · receive, write-off, and recount stock here
          {showMocks ? ' · demo data (no real products yet)' : ''}
        </p>
      </header>

      <InventoryFilters_ categories={categories} />
      <InventoryTable items={items} />
    </div>
  )
}
