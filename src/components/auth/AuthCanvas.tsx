import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

interface AuthCanvasProps {
  children: React.ReactNode
  /** Optional override for the top-right "Back to site" label */
  backLabel?: string
  /** Optional override for where "Back to..." points (defaults to home) */
  backHref?: string
}

/**
 * Shared dark/brand-tinted shell used by /auth/login, /admin/login,
 * and /agent/login. Provides:
 *   • dark herbal-green canvas + layered radial gradients + grain
 *   • logo + tagline top-left
 *   • "Back to site" top-right
 *   • centered content area for the form card
 *   • quiet brand footer
 */
export default function AuthCanvas({
  children,
  backLabel = 'Back to site',
  backHref = '/',
}: AuthCanvasProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12372D] text-white">
      {/* Layered burgundy + gold atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(68% 52% at 80% -8%, rgba(181,138,59,0.16), transparent 60%), radial-gradient(58% 62% at -5% 105%, rgba(0,107,60,0.55), transparent 62%), radial-gradient(46% 46% at 105% 100%, rgba(228,195,132,0.10), transparent 60%)',
        }}
      />
      {/* Edge vignette for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(120% 88% at 50% 28%, transparent 55%, rgba(12,2,6,0.6) 100%)',
        }}
      />
      {/* Grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6' /></svg>\")",
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/kerala-logo.png"
            alt="Ayurvedic Wellness Centre"
            width={714}
            height={391}
            className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        <Link
          href={backHref}
          className="group inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[#B58A3B]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {backLabel}
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-200px)] w-full max-w-md items-center justify-center px-4 pb-16 pt-8 sm:px-6">
        {children}
      </main>

      <footer className="relative z-10 mx-auto max-w-7xl px-4 pb-8 text-center sm:px-6 lg:px-8">
        <p className="font-body text-[11px] text-white/35">
          © Ayurvedic Wellness Centre · Brickfields, KL
        </p>
      </footer>
    </div>
  )
}
