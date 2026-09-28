import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

interface StaffLoginSplitProps {
  children: React.ReactNode
  eyebrow: string
  headline: string
  blurb: string
  image?: string
}

export default function StaffLoginSplit({
  children,
  eyebrow,
  headline,
  blurb,
  image = '/about/centre-lounge.jpg',
}: StaffLoginSplitProps) {
  return (
    <div className="grid min-h-screen bg-[#12372D] text-white lg:grid-cols-2">
      <aside className="relative h-56 overflow-hidden sm:h-72 lg:sticky lg:top-0 lg:h-screen">
        <Image src={image} alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(18,55,45,0.55) 0%, rgba(18,55,45,0.25) 35%, rgba(18,55,45,0.92) 100%)',
          }}
        />
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[#B58A3B]/60 to-transparent lg:block" />

        <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-8 lg:p-12">
          <Link href="/" className="group inline-flex w-fit items-center gap-2.5">
            <Image
              src="/awc-icon.png"
              alt=""
              width={1090}
              height={890}
              className="h-10 w-auto rounded-lg bg-white p-1.5 transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="font-heading text-[14px] font-extrabold leading-tight text-white">
              Ayurvedic Wellness<br /> Centre
            </span>
          </Link>

          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#E4C384]">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              {eyebrow}
            </span>
            <h2
              className="mt-2 font-heading text-[26px] font-bold leading-[1.1] sm:text-[34px] lg:text-[42px]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {headline}
            </h2>
            <p className="mt-3 hidden font-body text-[14px] leading-relaxed text-white/70 sm:block">{blurb}</p>
          </div>
        </div>
      </aside>

      <section className="relative flex flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(68% 52% at 80% -8%, rgba(181,138,59,0.14), transparent 60%), radial-gradient(58% 62% at 0% 105%, rgba(0,107,60,0.5), transparent 62%)',
          }}
        />
        <header className="relative z-10 flex justify-end px-4 py-5 sm:px-8">
          <Link
            href="/"
            className="group inline-flex min-h-[44px] items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[#B58A3B]"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to site
          </Link>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 items-center px-4 pb-10 sm:px-6">
          {children}
        </main>

        <footer className="relative z-10 px-4 pb-6 text-center">
          <p className="font-body text-[11px] text-white/35">© Ayurvedic Wellness Centre · Brickfields, KL</p>
        </footer>
      </section>
    </div>
  )
}
