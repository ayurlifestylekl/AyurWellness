import Image from 'next/image'
import Link from 'next/link'

import { urlForImage } from '@/sanity/image'
import type { SanityImageRef } from '@/types/treatments'

interface RelatedItem {
  _id: string
  title: string
  slug: string
  categorySlug: string
  duration: string | null
  heroImage: SanityImageRef | null
  categoryTitle: string
}

interface RelatedTherapiesProps {
  items: RelatedItem[]
}

export default function RelatedTherapies({ items }: RelatedTherapiesProps) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((t) => (
        <Link
          key={t._id}
          href={`/treatments/${t.categorySlug}/${t.slug}`}
          className="group overflow-hidden rounded-lg border border-accent/25 bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-[2px] hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-primary">
            {t.heroImage ? (
              <Image
                src={urlForImage(t.heroImage).width(600).height(450).fit('crop').url()}
                alt={t.heroImage.alt ?? t.title}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(181, 138, 59,0.18) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
                aria-hidden
              />
            )}
            <span className="pointer-events-none absolute left-1 top-1 h-2 w-2 border-l-2 border-t-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute right-1 top-1 h-2 w-2 border-r-2 border-t-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-accent" aria-hidden />
          </div>
          <div className="p-3.5">
            <div className="font-heading text-[14px] font-bold tracking-[-0.01em] text-primary">
              {t.title}
            </div>
            <div className="mt-1 font-heading text-[9px] font-semibold uppercase tracking-[0.2em] text-dark/50">
              {t.categoryTitle}
              {t.duration ? ` · ${t.duration}` : ''}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
