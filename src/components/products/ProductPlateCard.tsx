'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import type { Product, ProductBadge } from '@/types/content'
import NocturneFrame from './atmosphere/NocturneFrame'
import WishlistButton from '@/components/account/WishlistButton'

const badgeAccent: Record<ProductBadge, string> = {
  NEW:        'text-secondary',
  BESTSELLER: 'text-accent',
  SALE:       'text-primary',
  COMBO:      'text-secondary',
}

const badgeLabel: Record<ProductBadge, string> = {
  NEW: 'NEW',
  BESTSELLER: 'BESTSELLER',
  SALE: 'SALE',
  COMBO: 'COMBO',
}

export default function ProductPlateCard({ product, initialSaved = false }: { product: Product; initialSaved?: boolean }) {
  const outOfStock = product.stockQty === 0

  return (
    <motion.article variants={fadeUp(0)} className="group relative flex flex-col">
      {/* Wishlist heart — absolute overlay, click does not navigate */}
      <div className="absolute right-3 top-3 z-10">
        <WishlistButton productId={product.id} initialSaved={initialSaved} />
      </div>
      <Link
        href={`/products/${product.id}`}
        aria-label={`${product.name} — ${product.tagline}`}
        className="flex flex-col rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      >
        <NocturneFrame
          src={product.image}
          alt={`${product.name} — ${product.tagline}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          dimmed={outOfStock}
          imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          className="rounded-[2px]"
        >
          {/* bottom overlay — name + price */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 sm:inset-x-4 sm:bottom-4 sm:gap-3">
            <h3
              className="font-display text-[14px] italic leading-tight sm:text-[17px]"
              style={{
                color: '#FFF9F2',
                textShadow: '0 2px 14px rgba(0,0,0,0.6)',
              }}
            >
              {product.name}
            </h3>
            {outOfStock ? (
              <span
                className="font-display text-[11px] italic sm:text-[12px]"
                style={{ color: 'rgba(255, 249, 242,0.8)' }}
              >
                Out of stock
              </span>
            ) : (
              <span
                className="font-heading text-[12px] font-semibold tracking-[0.03em] text-accent sm:text-[13px]"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
              >
                RM{product.priceRm}
              </span>
            )}
          </div>
        </NocturneFrame>

        {/* below the frame — category + badge */}
        <div className="mt-2 flex items-center gap-1.5 font-heading text-[9px] font-semibold uppercase tracking-[0.18em] sm:mt-3 sm:gap-2 sm:text-[10px] sm:tracking-[0.22em]">
          <span className="truncate text-dark/55">
            {product.category.replace('-', ' ')}
          </span>
          {product.badge && (
            <>
              <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span className={`shrink-0 ${badgeAccent[product.badge]}`}>
                {badgeLabel[product.badge]}
              </span>
            </>
          )}
        </div>

        {/* gold underline that grows on hover */}
        <span
          aria-hidden
          className="mt-2 block h-px w-0 bg-accent transition-[width] duration-500 ease-out group-hover:w-10"
        />
      </Link>
    </motion.article>
  )
}
