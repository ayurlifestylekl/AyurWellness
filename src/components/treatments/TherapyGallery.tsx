import Image from 'next/image'

import type { GalleryImageRef } from '@/types/treatments'

interface TherapyGalleryProps {
  images: GalleryImageRef[]
}

export default function TherapyGallery({ images }: TherapyGalleryProps) {
  if (images.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {images.map((img, i) => (
        <div key={i} className="relative aspect-square overflow-hidden rounded">
          <Image
            src={img.url}
            alt={img.alt ?? `Treatment gallery image ${i + 1}`}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  )
}
