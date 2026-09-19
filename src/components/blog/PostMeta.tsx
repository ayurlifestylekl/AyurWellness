import React from 'react'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'

interface PostMetaProps {
  authorName: string
  authorRole: string | null
  authorImageUrl: string | null
  publishedAt: string
  readingMinutes: number
  variant?: 'light' | 'dark'
}

/**
 * Compact byline row used in the article hero.
 * - `light` variant sits on the cream backdrop above the hero image
 * - `dark`  variant is reserved for use over a Deep Herbal Green surface
 */
export default function PostMeta({
  authorName,
  authorRole,
  authorImageUrl,
  publishedAt,
  readingMinutes,
  variant = 'light',
}: PostMetaProps) {
  const isLight = variant === 'light'
  const formattedDate = (() => {
    try {
      return format(new Date(publishedAt), 'd MMMM yyyy')
    } catch {
      return publishedAt.slice(0, 10)
    }
  })()

  const nameClass = isLight ? 'text-primary' : 'text-white'
  const roleClass = isLight ? 'text-dark/55' : 'text-white/65'
  const dotClass  = isLight ? 'bg-accent/60' : 'bg-accent/70'
  const metaClass = isLight ? 'text-dark/55' : 'text-white/65'

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      {/* Author */}
      <div className="flex items-center gap-3">
        {authorImageUrl ? (
          <span className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-accent/40">
            <Image
              src={authorImageUrl}
              alt={authorName}
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>
        ) : (
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-[13px] font-bold text-primary"
          >
            {authorName
              .split(' ')
              .map((s) => s[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')}
          </span>
        )}
        <div className="flex flex-col">
          <span className={`font-heading text-[13px] font-bold uppercase tracking-[0.14em] ${nameClass}`}>
            {authorName}
          </span>
          {authorRole && (
            <span className={`font-body text-[12px] italic ${roleClass}`}>
              {authorRole}
            </span>
          )}
        </div>
      </div>

      {/* Vertical separator */}
      <span aria-hidden className={`hidden h-8 w-px sm:block ${isLight ? 'bg-primary/15' : 'bg-white/20'}`} />

      {/* Date + reading time */}
      <div className={`flex items-center gap-3 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] ${metaClass}`}>
        <span>{formattedDate}</span>
        <span aria-hidden className={`h-1 w-1 rounded-full ${dotClass}`} />
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-accent" strokeWidth={2.4} />
          {readingMinutes} min read
        </span>
      </div>
    </div>
  )
}
