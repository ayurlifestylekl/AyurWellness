import Link from 'next/link'
import { Plus, Upload, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  listProducts,
  listCategoriesInUse,
  type ProductFilters,
  type ProductListItem,
} from '@/lib/admin/products/queries'
import { DEMO_ADMIN_EMAIL, MOCK_PRODUCT_LIST } from '@/lib/admin/products/mocks'
import ProductsFilters from './ProductsFilters'
import ProductsTable from './ProductsTable'

function filterMocks(items: ProductListItem[], filters: ProductFilters): ProductListItem[] {
  return items.filter((p) => {
    if (filters.status && p.status !== filters.status) return false
    if (filters.category && p.category !== filters.category) return false
    if (filters.featured !== undefined && p.featured !== filters.featured) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const hay = [p.name, p.sku, p.slug].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export const metadata = { title: 'Products · Admin' }
export const dynamic = 'force-dynamic'

type Status = 'active' | 'draft' | 'archived'

interface PageProps {
  searchParams: {
    q?: string
    status?: string
    category?: string
    featured?: string
  }
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const filters: ProductFilters = {
    search: searchParams.q,
    status: searchParams.status as Status | undefined,
    category: searchParams.category,
    featured:
      searchParams.featured === 'true'
        ? true
        : searchParams.featured === 'false'
          ? false
          : undefined,
    limit: 50,
  }
  const me = await getCurrentUser()
  const [real, categoriesRaw] = await Promise.all([
    listProducts(supabase, filters),
    listCategoriesInUse(supabase),
  ])

  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const showMocks = isDemoAdmin && real.items.length === 0
  const items = showMocks ? filterMocks(MOCK_PRODUCT_LIST, filters) : real.items
  const total = showMocks ? items.length : real.total
  const categories =
    showMocks && categoriesRaw.length === 0
      ? Array.from(new Set(MOCK_PRODUCT_LIST.map((p) => p.category).filter((c): c is string => !!c)))
      : categoriesRaw

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Catalog
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
            Products
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {total} total · manage what&apos;s on sale, descriptions, images, bundles
            {showMocks ? ' · demo data (no real products yet)' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/import"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-2 text-[12.5px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Link>
          <a
            href="/admin/products/export"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-2 text-[12.5px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </a>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#006B3C] px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-[#006B3C]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add product
          </Link>
        </div>
      </header>

      <ProductsFilters categories={categories} />
      <ProductsTable items={items} />
    </div>
  )
}
