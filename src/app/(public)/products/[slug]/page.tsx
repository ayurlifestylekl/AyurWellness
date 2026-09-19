import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getStorefrontProducts,
  getStorefrontProductBySlug,
} from '@/lib/storefront/products'
import { categories } from '@/data/categories'
import ProductGallery from '@/components/products/detail/ProductGallery'
import ProductMeta from '@/components/products/detail/ProductMeta'
import ProductReviews from '@/components/products/detail/ProductReviews'
import RelatedProducts from '@/components/products/detail/RelatedProducts'

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const product = await getStorefrontProductBySlug(supabase, slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: `${product.name} — ${product.tagline}`,
    description: product.description,
    alternates: { canonical: `/products/${product.id}` },
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const product = await getStorefrontProductBySlug(supabase, slug)
  if (!product) notFound()

  const categoryLabel =
    categories.find((c) => c.slug === product.category)?.label ??
    product.category.replace('-', ' ')

  const all = await getStorefrontProducts(supabase)
  const related = all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3)

  return (
    <section className="relative bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-20 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[6fr_5fr] lg:gap-16">
          <ProductGallery product={product} />
          <ProductMeta product={product} categoryLabel={categoryLabel} />
        </div>

        <ProductReviews productId={product.id} />

        <RelatedProducts products={related} />

        <div className="mt-16 border-t border-accent/20 pt-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 font-display italic text-accent transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            ← Back to the Apothecary
          </Link>
        </div>
      </div>
    </section>
  )
}
