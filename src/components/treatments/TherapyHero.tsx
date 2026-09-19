import Image from 'next/image'

import { urlForImage } from '@/sanity/image'
import type { SanityImageRef } from '@/types/treatments'

interface TherapyHeroProps {
  image: SanityImageRef | null
  /** Plain image URL (Supabase). Preferred over `image` when present. */
  imageUrl?: string | null
  /** A second photo the clinic supplied for this therapy — when present, the
   *  hero splits 50/50 (this photo on the right) instead of showing one. */
  secondaryImage?: SanityImageRef | null
  /** Plain URL for the second photo (Supabase). Preferred over `secondaryImage`. */
  secondaryImageUrl?: string | null
  categoryTitle: string
  treatmentOrder: number | null
  treatmentTitle: string
}

export default function TherapyHero({
  image,
  imageUrl,
  secondaryImage,
  secondaryImageUrl,
  categoryTitle,
  treatmentOrder,
  treatmentTitle,
}: TherapyHeroProps) {
  const number =
    treatmentOrder != null ? String(treatmentOrder + 1).padStart(2, '0') : null
  const tagText = number ? `${categoryTitle} · No. ${number}` : categoryTitle

  const leftSrc = imageUrl || (image ? urlForImage(image).width(1400).fit('crop').url() : null)
  const rightSrc =
    secondaryImageUrl || (secondaryImage ? urlForImage(secondaryImage).width(1400).fit('crop').url() : null)
  const isSplit = !!(leftSrc && rightSrc)

  return (
    <div className="relative w-full overflow-hidden bg-primary">
      <div className="relative flex aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]">
        {leftSrc ? (
          <>
            <div className={`relative h-full ${isSplit ? 'w-1/2 border-r border-white/20' : 'w-full'}`}>
              <Image
                src={leftSrc}
                alt={image?.alt ?? `${treatmentTitle} hero image`}
                fill
                priority
                sizes={isSplit ? '50vw' : '100vw'}
                className="object-cover"
              />
            </div>
            {isSplit && (
              <div className="relative h-full w-1/2">
                <Image
                  src={rightSrc}
                  alt={secondaryImage?.alt ?? `${treatmentTitle} hero image, alternate view`}
                  fill
                  priority
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
            )}
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-primary"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(181, 138, 59,0.12) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            <p className="font-body text-[15px] italic text-white/60">
              Photo coming soon
            </p>
          </div>
        )}
        <div className="absolute left-4 top-4 max-w-[80%] truncate bg-primary/85 px-3 py-1.5 text-accent sm:left-6 sm:top-6">
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.22em]">
            {tagText}
          </span>
        </div>
      </div>
    </div>
  )
}
