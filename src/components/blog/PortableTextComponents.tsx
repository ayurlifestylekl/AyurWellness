import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { PortableTextComponents } from '@portabletext/react'

import { urlForImage } from '@/sanity/image'

/**
 * Editorial-grade serializer map for Sanity Portable Text.
 *
 * Most styling lives in the `prose-journal` Tailwind plugin theme
 * (see tailwind.config.ts). The serializers below add the *layout
 * tricks* the prose plugin can't express on its own:
 *
 *   • Inline images break out of the body column with a captioned <figure>
 *   • H2s grow a small Turmeric Gold underline rule
 *   • Pull quotes (`blockquote`) are pre-styled by prose theme
 *   • External links open in a new tab with safe rel attributes
 */
export const portableTextComponents: PortableTextComponents = {
  // ── Block-level types ────────────────────────────────────────────
  types: {
    /**
     * Inline images. Break out wider than the body column on desktop,
     * rounded corners, optional italic Lora caption beneath.
     */
    inlineImage: ({ value }) => {
      if (!value?.asset?._ref) return null
      const url = urlForImage(value).width(1600).fit('max').auto('format').url()
      const alt: string = value.alt ?? ''
      const caption: string | undefined = value.caption

      return (
        <figure className="not-prose my-12 md:-mx-12 lg:-mx-24">
          <div className="relative overflow-hidden rounded-[20px] shadow-[0_2px_4px_rgba(0,107,60,0.06),0_28px_72px_-24px_rgba(0,107,60,0.28)] ring-1 ring-primary/10">
            <Image
              src={url}
              alt={alt}
              width={1600}
              height={1067}
              sizes="(min-width: 1024px) 960px, (min-width: 768px) 720px, 100vw"
              className="h-auto w-full"
            />
            {/* Subtle warm overlay so images sit in the brand atmosphere */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/8 via-transparent to-transparent mix-blend-multiply"
            />
          </div>
          {caption && (
            <figcaption className="mt-3 px-2 text-center font-body text-[14px] italic leading-snug text-dark/55">
              {caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },

  // ── Block styles (paragraphs, headings, quotes) ──────────────────
  block: {
    h2: ({ children }) => (
      <h2 className="relative">
        {children}
        <span
          aria-hidden
          className="mt-3 block h-[2px] w-12 bg-accent"
        />
      </h2>
    ),
    h3: ({ children }) => <h3>{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="not-italic-marker">{children}</blockquote>
    ),
    normal: ({ children }) => <p>{children}</p>,
  },

  // ── Marks (inline annotations) ────────────────────────────────────
  marks: {
    link: ({ value, children }) => {
      const href: string = value?.href ?? '#'
      const isExternal = /^https?:\/\//i.test(href)
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        )
      }
      return <Link href={href}>{children}</Link>
    },
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
  },

  // ── Lists ─────────────────────────────────────────────────────────
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
}
