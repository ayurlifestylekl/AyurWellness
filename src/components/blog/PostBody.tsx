import React from 'react'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'

import { portableTextComponents } from './PortableTextComponents'

interface PostBodyProps {
  body: PortableTextBlock[]
}

/**
 * Wraps the PortableText renderer in a centred reading column with the
 * `prose-journal` Tailwind theme applied.
 *
 * The drop cap is implemented as a CSS `::first-letter` rule (inlined
 * via <style>) so it works on whatever paragraph happens to be first,
 * without any custom serializer logic.
 */
export default function PostBody({ body }: PostBodyProps) {
  return (
    <div className="relative mx-auto max-w-[720px] px-6 py-20 sm:px-8 md:py-28">
      {/* Drop cap rule — Turmeric Gold, Montserrat 800, 5 lines tall */}
      <style>{`
        .post-body > p:first-of-type::first-letter {
          font-family: var(--font-montserrat), sans-serif;
          font-weight: 800;
          color: #B58A3B;
          float: left;
          font-size: 5.4em;
          line-height: 0.85;
          padding-right: 0.12em;
          padding-top: 0.08em;
          margin-bottom: -0.18em;
        }
        .post-body > p:first-of-type::first-line {
          font-variant: small-caps;
          letter-spacing: 0.02em;
        }
      `}</style>

      <article className="post-body prose prose-journal prose-lg max-w-none">
        <PortableText value={body} components={portableTextComponents} />
      </article>
    </div>
  )
}
