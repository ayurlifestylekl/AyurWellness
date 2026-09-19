import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Sparkles, Gift, Star } from 'lucide-react'
import { FloatingLeaf, BotanicalMandala } from '@/components/ui/Decorations'

/**
 * Editorial split shell for /auth/login (customer only).
 * Left pane: brand atmosphere — serif quote, signature, decorations.
 * Right pane: form surface — children passed in (LoginForm).
 *
 * Stacks vertically below `lg` — left becomes ~30vh hero, form below.
 */
export default function CustomerLoginSplit({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12372D] text-white">
      {/* ── MOBILE-ONLY: full-screen warm brand canvas ──────────────────
         Direction 2 (Lifted Form Card) on mobile only. Fills the whole
         viewport with the same atmosphere as the desktop left pane, so
         the form card below can float on top with margin.
         Hidden at lg+ — desktop keeps its split. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(80% 50% at 30% 12%, rgba(181, 138, 59,0.22), transparent 70%), radial-gradient(70% 50% at 80% 92%, rgba(0,107,60,0.18), transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6' /></svg>\")",
          }}
        />
        {/* Mandala: pushed further off-screen so only an elegant arc hints
            at it; lower opacity so it never competes with the headline. */}
        <BotanicalMandala
          className="absolute -right-44 -top-8 h-[320px] w-[320px]"
          opacity={0.05}
          stroke="#B58A3B"
        />
        {/* Single, intentionally-placed leaf in the lower third — small,
            calm, doesn't crop the edge. */}
        <FloatingLeaf
          className="absolute right-4 bottom-40 h-9 w-8 rotate-[12deg]"
          color="#006B3C"
          strokeColor="#B58A3B"
          opacity={0.14}
        />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[55fr_45fr]">
        {/* ── LEFT PANE — brand atmosphere ──────────────────────────── */}
        <aside className="relative flex flex-col overflow-hidden lg:max-h-none lg:h-screen">
          {/* DESKTOP-ONLY aside gradients (mobile uses the outer canvas above). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{
              backgroundImage:
                'radial-gradient(70% 60% at 30% 20%, rgba(181, 138, 59,0.18), transparent 65%), radial-gradient(60% 60% at 80% 100%, rgba(0,107,60,0.16), transparent 65%)',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden opacity-[0.05] mix-blend-overlay lg:block"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6' /></svg>\")",
            }}
          />
          {/* DESKTOP-ONLY decorations (mobile uses outer-canvas decorations). */}
          <BotanicalMandala
            className="pointer-events-none absolute -right-32 top-32 hidden h-[420px] w-[420px] lg:block"
            opacity={0.08}
            stroke="#B58A3B"
          />
          <FloatingLeaf
            className="pointer-events-none absolute right-12 bottom-16 hidden h-24 w-20 rotate-[12deg] lg:block"
            color="#006B3C"
            strokeColor="#B58A3B"
            opacity={0.18}
          />
          <FloatingLeaf
            className="pointer-events-none absolute left-8 top-44 hidden h-16 w-14 -rotate-[20deg] lg:block"
            color="#006B3C"
            strokeColor="#B58A3B"
            opacity={0.22}
          />

          {/* Top bar — logo + back to site (desktop sticks at top, mobile inline) */}
          <header className="relative z-10 flex items-center justify-between px-6 py-3 sm:px-10 sm:py-5">
            <Link href="/" className="group flex items-center gap-2.5">
              <Image
                src="/kerala-logo.png"
                alt="Ayurvedic Wellness Centre"
                width={714}
                height={391}
                className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </Link>
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[#B58A3B] lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back
            </Link>
            <Link
              href="/"
              className="group hidden items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[#B58A3B] lg:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to site
            </Link>
          </header>

          {/* Editorial content — anchored top on mobile, centered on desktop */}
          <div className="relative z-10 flex flex-col px-6 py-3 sm:px-10 sm:py-6 lg:flex-1 lg:justify-center lg:px-14 lg:py-12">
            {/* Eyebrow */}
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#B58A3B]/35 bg-[#B58A3B]/10 px-3 py-1 sm:mb-5">
              <Sparkles className="h-3 w-3 text-[#B58A3B]" />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.28em] text-[#B58A3B]">
                Wellness Member
              </span>
            </div>

            {/* Editorial serif quote — Playfair */}
            <h2
              className="font-display text-[26px] leading-[1.08] text-white sm:text-[38px] lg:text-[52px]"
              style={{ letterSpacing: '-0.025em', fontWeight: 500 }}
            >
              Where the kitchen
              <br />
              <em className="font-display not-italic text-[#B58A3B]">is the pharmacy.</em>
            </h2>

            {/* Mobile-only finishing flourish — small gold rule + tagline.
                Anchors the headline and adds editorial credibility without
                taking real vertical space. Hidden at sm+ where signature
                line + offer chip already do this job. */}
            <div className="mt-4 flex items-center gap-2.5 sm:hidden">
              <span className="h-px w-10 bg-gradient-to-r from-[#B58A3B]/70 to-[#B58A3B]/0" />
              <span className="font-body text-[10.5px] italic text-white/55">
                Authentic traditional Ayurveda
              </span>
            </div>

            {/* Signature line — desktop + tablet only */}
            <p
              className="mt-4 hidden font-body italic text-white/55 sm:block sm:text-[14px]"
              style={{ fontSize: 13, lineHeight: 1.65 }}
            >
              — our Vaidyas · <span className="not-italic">B.A.M.S., M.D. (Ayu)</span>
            </p>

            {/* Welcome offer chip — desktop + tablet only (form-side on mobile already has the price prompt via the create-account tab) */}
            <div className="mt-6 hidden w-fit items-center gap-2.5 rounded-full border border-[#B58A3B]/30 bg-[#B58A3B]/[0.08] py-2 pl-2.5 pr-4 backdrop-blur-sm sm:mt-8 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B58A3B]/20">
                <Gift className="h-3 w-3 text-[#B58A3B]" />
              </span>
              <span className="font-body text-[12.5px] text-white/80">
                New here?{' '}
                <span className="font-semibold text-[#B58A3B]">RM 10 off</span> your first order.
              </span>
            </div>
          </div>

          {/* Footer credentials — bottom of left pane, desktop only */}
          <div className="relative z-10 hidden border-t border-white/5 px-14 py-5 lg:block">
            <div className="flex items-center gap-5 font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
              <span>Brickfields, KL</span>
              <span className="h-px w-4 bg-white/15" />
              <span className="inline-flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-[#B58A3B] text-[#B58A3B]" />
                4.9
              </span>
              <span className="h-px w-4 bg-white/15" />
              <span>5,000+ members</span>
            </div>
          </div>
        </aside>

        {/* ── RIGHT PANE — form surface ───────────────────────────────── */}
        {/* Mobile: a "lifted" glass card floating on the warm canvas,
            with margin around all four sides.
            Desktop: full-bleed deeper-green pane (unchanged). */}
        <section className="relative flex flex-col px-3 pb-3 sm:px-4 sm:pb-4 lg:p-0 lg:bg-[#12372D] lg:h-screen">
          {/* Desktop-only gold seam between the panes */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-px lg:block"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(181,138,59,0.4), transparent)' }}
          />
          {/* Desktop-only subtle top highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-white/8 to-transparent lg:block"
          />
          <div
            className={[
              // Mobile: glass card
              'relative flex flex-1 flex-col rounded-[28px] border border-white/12 bg-[#12372D]/88 backdrop-blur-xl',
              'shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.06)]',
              // Desktop overrides: full-bleed, no card chrome
              'lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none',
            ].join(' ')}
          >
            <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-7 sm:px-10 lg:px-12 lg:py-10">
              <div className="w-full max-w-md">{children}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
