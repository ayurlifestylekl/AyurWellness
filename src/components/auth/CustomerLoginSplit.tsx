import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Sparkles, Gift, Star } from 'lucide-react'

/**
 * Split shell for /auth/login (customer only): photo + brand story on the
 * left, the form in a white card on warm ivory on the right. Below `lg` the
 * photo becomes a short banner above the card.
 */
export default function CustomerLoginSplit({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-[#F5F4EE] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative h-[300px] overflow-hidden text-white sm:h-[340px] lg:sticky lg:top-0 lg:h-screen">
        <Image
          src="/hero-shirodhara.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="object-cover object-[60%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(13,42,34,0.70) 0%, rgba(13,42,34,0.20) 30%, rgba(13,42,34,0.35) 55%, rgba(13,42,34,0.94) 100%)',
          }}
        />
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[#E4C384]/60 to-transparent lg:block" />

        <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-8 lg:p-12">
          <div className="flex items-center justify-between">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.04]">
                <Image src="/awc-icon.png" alt="" width={1090} height={890} className="h-7 w-auto" />
              </span>
              <span className="font-heading text-[13.5px] font-bold leading-[1.15] text-white">
                Ayurvedic Wellness
                <br />
                Centre
              </span>
            </Link>
            <Link
              href="/"
              className="group inline-flex min-h-[44px] items-center gap-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/75 transition-colors hover:text-[#E4C384] lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back
            </Link>
          </div>

          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E4C384]/40 bg-[#0D2A22]/40 px-3 py-1 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-[#E4C384]" />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.26em] text-[#E4C384]">Wellness Member</span>
            </span>
            <h2
              className="mt-3 font-display text-[30px] leading-[1.06] text-white sm:mt-4 sm:text-[40px] lg:text-[54px]"
              style={{ letterSpacing: '-0.025em', fontWeight: 500 }}
            >
              Where the kitchen
              <br />
              <em className="text-[#E4C384]">is the pharmacy.</em>
            </h2>
            <p className="mt-3 hidden font-body text-[14px] italic text-white/70 sm:block">
              — our Vaidyas · <span className="not-italic">B.A.M.S., M.D. (Ayu)</span>
            </p>
            <div className="mt-6 hidden w-fit items-center gap-2.5 rounded-full border border-white/15 bg-white/10 py-2 pl-2.5 pr-4 backdrop-blur-md sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E4C384]">
                <Gift className="h-3 w-3 text-[#12372D]" />
              </span>
              <span className="font-body text-[12.5px] text-white/90">
                New here? <span className="font-semibold text-[#E4C384]">RM 10 off</span> your first order.
              </span>
            </div>
            <div className="mt-8 hidden items-center gap-4 border-t border-white/15 pt-5 font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 lg:flex">
              <span>Brickfields, KL</span>
              <span className="h-px w-4 bg-white/25" />
              <span className="inline-flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-[#E4C384] text-[#E4C384]" />
                4.9
              </span>
              <span className="h-px w-4 bg-white/25" />
              <span>5,000+ members</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="relative flex flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(60% 40% at 100% 0%, rgba(181,138,59,0.12), transparent 70%), radial-gradient(50% 40% at 0% 100%, rgba(0,107,60,0.08), transparent 70%)',
          }}
        />
        <header className="relative z-10 hidden justify-end px-8 py-5 lg:flex">
          <Link
            href="/"
            className="group inline-flex min-h-[44px] items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/50 transition-colors hover:text-[#B58A3B]"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to site
          </Link>
        </header>

        <main className="relative z-10 mx-auto -mt-10 flex w-full max-w-[500px] flex-1 items-start px-4 pb-10 sm:-mt-14 lg:mt-0 lg:items-center lg:pb-12">
          <div
            className="relative w-full overflow-hidden rounded-[28px] border border-[#12372D]/[0.06] bg-white p-6 sm:p-9"
            style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.04), 0 30px 60px -30px rgba(18,55,45,0.35), 0 12px 24px -16px rgba(181,138,59,0.18)' }}
          >
            <span aria-hidden className="absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#B58A3B] to-transparent" />
            {children}
          </div>
        </main>

        <footer className="relative z-10 px-4 pb-6 text-center">
          <p className="font-body text-[11px] text-[#12372D]/40">© Ayurvedic Wellness Centre · Brickfields, KL</p>
        </footer>
      </section>
    </div>
  )
}
