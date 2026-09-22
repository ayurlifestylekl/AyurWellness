'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Calendar } from 'lucide-react'

import CTAButton from '@/components/ui/CTAButton'
import { staggerParent, fadeUp, inViewOnce } from '@/lib/motion'
import { whatsappLink } from '@/lib/clinic'

/* Gold-diamond pattern — duplicated from the original site so this
 * component stands alone. */
const heroDiamondPattern = {
  backgroundImage: `
    radial-gradient(circle, rgba(181, 138, 59,0.04) 1px, transparent 1px),
    radial-gradient(circle, rgba(181, 138, 59,0.04) 1px, transparent 1px)
  `,
  backgroundSize: '28px 28px',
  backgroundPosition: '0 0, 14px 14px',
}

interface FreeConsultationBlockProps {
  /** Optional override for the WhatsApp prefilled message. */
  whatsappMessage?: string
}

/**
 * Full-width dark-green CTA block used at the bottom of every public
 * treatments page (L1, L2, L3). Visually mirrors the hero with the
 * same diamond pattern + gold frame.
 */
export default function FreeConsultationBlock({
  whatsappMessage = "Hi, I'd like to book a free Ayurveda consultation.",
}: FreeConsultationBlockProps) {
  const whatsappHref = whatsappLink(whatsappMessage)

  return (
    <section
      aria-labelledby="free-consult-heading"
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0B1F16 0%, #12372D 55%, #0A1A12 100%)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 5% 0%, rgba(181, 138, 59,0.25) 0%, transparent 45%), radial-gradient(ellipse at 95% 100%, rgba(18,55,45,0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 40%, rgba(181, 138, 59,0.06) 0%, transparent 35%)',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0" style={heroDiamondPattern} aria-hidden />
      <div className="grain-overlay-dark pointer-events-none absolute inset-0" aria-hidden />

      <div className="pointer-events-none absolute inset-3 border border-accent/12 sm:inset-6 md:inset-8" aria-hidden />
      <div className="pointer-events-none absolute inset-5 border border-accent/6 sm:inset-8 md:inset-10" aria-hidden />

      <div className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-accent/20 sm:left-6 sm:top-6 md:left-8 md:top-8" aria-hidden />
      <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-accent/20 sm:right-6 sm:top-6 md:right-8 md:top-8" aria-hidden />
      <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-accent/20 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8" aria-hidden />
      <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-accent/20 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8" aria-hidden />

      <motion.div
        variants={staggerParent(0.1, 0.05)}
        initial="initial"
        whileInView="animate"
        viewport={inViewOnce}
        className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-8 py-12 sm:px-10 md:py-14 lg:grid-cols-[3fr_2fr] lg:gap-12 lg:px-12 lg:py-16"
      >
        <div className="flex flex-col gap-3.5">
          <motion.div variants={fadeUp(0)} className="flex items-center gap-3">
            <span className="h-[2px] w-14 rounded-full bg-accent" aria-hidden />
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              Free Consultation
            </span>
          </motion.div>

          <motion.h2
            id="free-consult-heading"
            variants={fadeUp(0)}
            className="max-w-xl font-heading font-extrabold leading-[1.02] text-white"
            style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.5rem)', letterSpacing: '-0.03em' }}
          >
            A free consultation
            <br />
            with our <span className="font-body italic text-accent">Ayurveda therapist.</span>
          </motion.h2>

          <motion.p variants={fadeUp(0)} className="max-w-md font-body text-[13.5px] leading-[1.65] text-white/50">
            We provide free consultations with our KKM-registered Ayurveda practitioner,
            who holds a B.A.M.S degree and specialises in personalised treatment protocols.
          </motion.p>

          <motion.div variants={fadeUp(0)} className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {['KKM-Registered', 'B.A.M.S', 'our therapists'].map((cred, i, arr) => (
              <React.Fragment key={cred}>
                <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  {cred}
                </span>
                {i < arr.length - 1 && <span className="h-3 w-px bg-accent/25" aria-hidden />}
              </React.Fragment>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp(0)}
            className="h-px w-20"
            style={{ background: 'linear-gradient(to right, rgba(181, 138, 59,0.45), transparent)' }}
            aria-hidden
          />

          <motion.div variants={fadeUp(0)} className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <CTAButton href="/book/consultation" variant="primary" size="lg" icon={<Calendar className="h-4 w-4" />}>
              Book Free Consultation
            </CTAButton>
            <CTAButton href={whatsappHref} variant="outlineLight" size="lg" icon={<MessageCircle className="h-4 w-4" />}>
              WhatsApp Us
            </CTAButton>
          </motion.div>
        </div>

        <motion.aside variants={fadeUp(0.1)} className="relative w-full">
          <div className="rounded-xl bg-white/[0.06] p-5 ring-1 ring-white/15 sm:p-6">
            <div className="mb-3 h-px w-10" style={{ background: 'linear-gradient(to right, rgba(181, 138, 59,0.5), transparent)' }} aria-hidden />
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.25em] text-accent">We treat</span>

            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 font-body text-[13px] leading-[1.5] text-white/75">
              {['Chronic back pain', 'Joint stiffness', 'Low back pain', 'Skin conditions', 'Gastric issues', 'Stress & anxiety', 'Sleep disorders', 'Hair fall'].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
              <span className="h-px w-6 bg-accent/40" aria-hidden />
              <span className="font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-white/45">
                Consultation is always free
              </span>
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </section>
  )
}
