import type { Metadata } from 'next'
import { products } from '@/data/products'
import ProductsPageClient from '@/components/products/ProductsPageClient'
import ProductsHeroManifesto from '@/components/products/ProductsHeroManifesto'
import TrustStrip from '@/components/sections/TrustStrip'

export const metadata: Metadata = {
  title: 'The Apothecary — Authentic Ayurvedic Formulas | Ayurvedic Wellness Centre',
  description:
    'Shop authentic traditional Ayurvedic formulas — herbal oils and wellness essentials, hand-prepared per classical texts and prescribed by our Vaidyas.',
  alternates: { canonical: '/products' },
  robots: { index: true, follow: true },
}

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { category } = await searchParams

  return (
    <main className="min-h-screen bg-cream">
      <ProductsHeroManifesto productCount={products.length} />
      <TrustStrip />
      <div className="mx-auto max-w-7xl px-6 pt-10 sm:px-8 md:pt-14 lg:px-12">
        <header className="mb-8 text-center lg:text-left">
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            The Apothecary
          </span>
          <h1 className="mt-2 font-heading text-[32px] font-bold leading-tight text-primary sm:text-[40px]">
            Shop Traditional Ayurvedic Formulas
          </h1>
          <p className="mx-auto mt-2 max-w-2xl font-body text-[14px] text-dark/65 lg:mx-0">
            Hand-prepared herbal oils and wellness essentials, formulated per classical Ayurvedic texts and prescribed by our Vaidyas.
          </p>
        </header>
      </div>
      <ProductsPageClient products={products} initialCategory={category} />
    </main>
  )
}
