import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { BotanicalMandala } from '@/components/ui/Decorations'
import type { Author } from '@/types/blog'

interface AuthorBioCardProps {
  author: Author
}

/**
 * "About the author" footer card.
 *
 * Deep Herbal Green surface with a BotanicalMandala flank, the author's
 * portrait, name, role, bio and a link to all journal posts. Mirrors the
 * pull-quote card pattern in CommitmentCTA so it feels native to the site.
 */
export default function AuthorBioCard({ author }: AuthorBioCardProps) {
  return (
    <section
      aria-labelledby="author-card-heading"
      className="relative mx-auto max-w-5xl px-6 sm:px-8 lg:px-12"
    >
      <div className="relative overflow-hidden rounded-[28px] bg-primary px-8 py-12 ring-1 ring-primary/30 sm:px-12 sm:py-14 md:px-16 md:py-16">
        {/* Atmospheric backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 10% 0%, rgba(181, 138, 59,0.22) 0%, transparent 55%), radial-gradient(ellipse at 95% 100%, rgba(0,107,60,0.16) 0%, transparent 55%)',
          }}
        />

        {/* Grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Mandala flank */}
        <div className="pointer-events-none absolute -bottom-32 -right-24 hidden h-[440px] w-[440px] md:block">
          <BotanicalMandala opacity={0.08} />
        </div>

        <div className="relative grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-12">
          {/* Portrait */}
          <div className="md:col-span-4">
            <div className="relative mx-auto aspect-[4/5] w-44 overflow-hidden rounded-[20px] ring-1 ring-accent/40 md:mx-0 md:w-full md:max-w-[220px]">
              {author.imageUrl ? (
                <Image
                  src={author.imageUrl}
                  alt={author.name}
                  fill
                  sizes="(min-width: 768px) 220px, 176px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/5 font-heading text-3xl font-extrabold text-accent">
                  {author.name
                    .split(' ')
                    .map((s) => s[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
              {/* Warm overlay */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent mix-blend-multiply"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="md:col-span-8">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
              About the author
            </span>

            <h3
              id="author-card-heading"
              className="mt-3 font-heading text-[28px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white sm:text-[34px] md:text-[38px]"
            >
              {author.name}
            </h3>

            {author.role && (
              <p className="mt-2 font-body text-[14px] italic text-accent/85">
                {author.role}
              </p>
            )}

            {author.bio && (
              <p className="mt-5 max-w-2xl font-body text-[16px] leading-[1.85] text-white/75 md:text-[17px]">
                {author.bio}
              </p>
            )}

            <div className="mt-7">
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-accent transition-colors duration-200 hover:text-white"
              >
                <span>Read all journal entries</span>
                <ArrowUpRight
                  className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={2.6}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
