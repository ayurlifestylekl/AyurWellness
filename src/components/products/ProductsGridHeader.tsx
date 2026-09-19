'use client'

import React from 'react'
import SortMenu, { type SortOption } from './SortMenu'

interface ProductsGridHeaderProps {
  count: number
  categoryLabel: string
  sort: SortOption
  onSortChange: (s: SortOption) => void
}

export default function ProductsGridHeader({
  count, categoryLabel, sort, onSortChange,
}: ProductsGridHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4 border-b border-primary/10 pb-4">
      <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.28em] text-dark/55">
        {count} Formula{count === 1 ? '' : 'e'}
        <span className="mx-2 text-accent/70">·</span>
        <span className="text-primary/70">{categoryLabel}</span>
      </p>
      <SortMenu value={sort} onChange={onSortChange} />
    </div>
  )
}
