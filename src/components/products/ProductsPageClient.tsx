'use client'

import React, { useCallback, useMemo, useState } from 'react'
import type { Product } from '@/types/content'
import { categories } from '@/data/categories'
import ProductsSidebar, {
  filterByPriceTier,
  type PriceTier,
} from './ProductsSidebar'
import ProductsGridHeader from './ProductsGridHeader'
import ProductsFilterDrawer from './ProductsFilterDrawer'
import ProductGrid from './ProductGrid'
import SortMenu, { type SortOption } from './SortMenu'

interface ProductsPageClientProps {
  products: Product[]
  initialCategory?: string
}

export default function ProductsPageClient({
  products, initialCategory,
}: ProductsPageClientProps) {
  const [category, setCategory] = useState(initialCategory || 'all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [priceTier, setPriceTier] = useState<PriceTier>('all')

  const onCategoryChange = useCallback((cat: string) => {
    setCategory(cat)
    const url = cat === 'all' ? '/products' : `/products?category=${cat}`
    window.history.replaceState(null, '', url)
  }, [])

  const onSearchChange = useCallback((q: string) => setSearch(q), [])
  const onSortChange = useCallback((s: SortOption) => setSort(s), [])
  const onPriceTierChange = useCallback((t: PriceTier) => setPriceTier(t), [])

  const onClear = useCallback(() => {
    setCategory('all')
    setSearch('')
    setSort('newest')
    setPriceTier('all')
    window.history.replaceState(null, '', '/products')
  }, [])

  const hasActiveFilters =
    category !== 'all' || search.trim().length > 0 || priceTier !== 'all'

  const activeCategoryLabel = useMemo(() => {
    if (category === 'all')    return 'All'
    if (category === 'combos') return 'Combos'
    if (category === 'herbal') return 'Herbal'
    return categories.find((c) => c.slug === category)?.label ?? category
  }, [category])

  const filtered = useMemo(() => {
    let result = [...products]

    if (category === 'combos')       result = result.filter((p) => p.isBundle)
    else if (category === 'herbal')  result = result.filter((p) => !p.isBundle)
    else if (category !== 'all')     result = result.filter((p) => p.category === category)

    result = filterByPriceTier(result, priceTier)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
    }

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.priceRm - b.priceRm)
        break
      case 'price-desc':
        result.sort((a, b) => b.priceRm - a.priceRm)
        break
      case 'newest':
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        break
    }

    return result
  }, [products, category, priceTier, search, sort])

  return (
    <section id="products" className="relative bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 md:py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
          {/* Sidebar — desktop only */}
          <div className="hidden lg:sticky lg:top-[108px] lg:block lg:max-h-[calc(100vh-140px)] lg:self-start lg:overflow-y-auto lg:pr-2">
            <ProductsSidebar
              activeCategory={category}
              onCategoryChange={onCategoryChange}
              search={search}
              onSearchChange={onSearchChange}
              priceTier={priceTier}
              onPriceTierChange={onPriceTierChange}
              onClear={onClear}
              products={products}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Grid column */}
          <div>
            {/* Mobile top row — compact Filter + Sort side by side */}
            <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
              <ProductsFilterDrawer triggerLabel={`Filter · ${filtered.length}`}>
                <ProductsSidebar
                  activeCategory={category}
                  onCategoryChange={onCategoryChange}
                  search={search}
                  onSearchChange={onSearchChange}
                  priceTier={priceTier}
                  onPriceTierChange={onPriceTierChange}
                  onClear={onClear}
                  products={products}
                  hasActiveFilters={hasActiveFilters}
                />
              </ProductsFilterDrawer>
              <SortMenu value={sort} onChange={onSortChange} />
            </div>

            {/* Desktop grid header */}
            <div className="hidden lg:block">
              <ProductsGridHeader
                count={filtered.length}
                categoryLabel={activeCategoryLabel}
                sort={sort}
                onSortChange={onSortChange}
              />
            </div>

            <ProductGrid
              products={filtered}
              total={products.length}
              onClearFilters={onClear}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
