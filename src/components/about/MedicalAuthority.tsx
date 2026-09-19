'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { clipReveal, fadeUp, slideIn, staggerParent, inViewOnce } from '@/lib/motion'

interface Credential {
  label: string
  values: string[]
}

const credentials: Credential[] = [
  {
    label: 'Qualification',
    values: [
      'B.A.M.S — Bachelor of Ayurvedic Medicine and Surgery',
      'M.D (Ayurveda)',
    ],
  },
  {
    label: 'Registered With',
    values: ['National Council of Indian System of Medicine'],
  },
  {
    label: 'Recognised In',
    values: [
      'Malaysia under the Ministry of Health (KKM — Kementerian Kesihatan Malaysia) as a Traditional & Complementary Medicine (T&CM) Ayurveda Practitioner.',
    ],
  },
]

/**
 * Medical authority — cinematic split.
 * Left: credentials on nearBlackGreen. Right: full-bleed photograph.
 * No floating cards, no bobbing animations, no gradient icon circles.
 */
export default function MedicalAuthority() {
  return (
    <section
      aria-labelledby="authority-heading"
      className="relative overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
        {/* ── LEFT: Credentials panel ─────────────────── */}
        <motion.div
          variants={slideIn('left', 0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="relative flex flex-col justify-center bg-[#75B843] px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-11"
        >
          {/* Grain */}
          <div className="grain-overlay-dark pointer-events-none absolute inset-0" aria-hidden />

          {/* Subtle glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 40% 60%, rgba(181, 138, 59,0.06) 0%, transparent 55%)',
            }}
            aria-hidden
          />

          <motion.div
            variants={staggerParent(0.1, 0.05)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="relative z-10 max-w-lg"
          >
            <motion.span
              variants={fadeUp(0)}
              className="font-heading text-[10px] font-semibold uppercase tracking-[0.35em] text-accent/70"
            >
              Medical Authority
            </motion.span>

            <motion.h2
              variants={fadeUp(0)}
              id="authority-heading"
              className="mt-3 font-heading text-[1.6rem] font-extrabold leading-[1.08] text-white sm:text-[1.85rem] lg:text-[2rem]"
            >
              Led by Our Vaidya,{' '}
              <span className="font-body italic text-accent">
                B.A.M.S., M.D. (Ayu)
              </span>
            </motion.h2>

            <motion.p
              variants={fadeUp(0)}
              className="mt-3 font-body text-[14px] leading-[1.65] text-white/55"
            >
              Our therapies are guided by a qualified Ayurveda Vaidya with over
              16 years of clinical experience.
            </motion.p>

            {/* Single experience stat */}
            <motion.div variants={fadeUp(0)} className="mt-4">
              <p className="font-heading text-[2rem] font-extrabold leading-none tracking-tight text-white">
                16+
              </p>
              <p className="mt-1 font-body text-[9.5px] uppercase tracking-[0.2em] text-white/35">
                Years Clinical Experience
              </p>
            </motion.div>

            {/* Credential rows */}
            <motion.div variants={fadeUp(0)} className="mt-5 flex flex-col">
              {credentials.map((cred, i) => (
                <div key={cred.label}>
                  {i > 0 && (
                    <div
                      className="h-px"
                      style={{
                        background:
                          'linear-gradient(to right, rgba(181, 138, 59,0.15), transparent)',
                      }}
                      aria-hidden
                    />
                  )}
                  <div className="py-2.5">
                    <span className="font-heading text-[9px] font-semibold uppercase tracking-[0.25em] text-accent/50">
                      {cred.label}
                    </span>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {cred.values.map((value, vIdx) => (
                        <p
                          key={vIdx}
                          className="font-heading text-[13px] font-semibold leading-[1.45] text-white/80"
                        >
                          {value}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="h-px"
                style={{
                  background:
                    'linear-gradient(to right, rgba(181, 138, 59,0.15), transparent)',
                }}
                aria-hidden
              />
            </motion.div>

            {/* Therapist experience — separate from doctor's credentials */}
            <motion.div
              variants={fadeUp(0)}
              className="mt-4 border-l-2 border-accent/40 pl-4"
            >
              <span className="font-heading text-[9px] font-semibold uppercase tracking-[0.25em] text-accent/50">
                Therapist Experience
              </span>
              <p className="mt-1 font-body text-[12.5px] leading-[1.6] text-white/50">
                Our team of experienced Ayurvedic therapists are professionally
                trained in classical Ayurveda Panchakarma and specialised
                therapies. With years of clinical experience, they focus on
                delivering authentic, result-oriented treatments with utmost
                care and consistency.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Full-bleed photograph ─────────────── */}
        <motion.div
          variants={clipReveal('right', 0.15)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="relative hidden min-h-[400px] lg:block"
        >
          <Image
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80"
            alt="Our Vaidya, B.A.M.S., M.D. (Ayu) — Lead Ayurvedic Physician at Ayurvedic Wellness Centre"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 40vw, 0vw"
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: 'rgba(0, 107, 60,0.35)' }}
            aria-hidden
          />
          <div className="grain-overlay-dark pointer-events-none absolute inset-0" aria-hidden />
          {/* Left edge gold hairline */}
          <div
            className="absolute inset-y-0 left-0 w-px"
            style={{
              background:
                'linear-gradient(to bottom, transparent, rgba(181, 138, 59,0.3), transparent)',
            }}
            aria-hidden
          />
        </motion.div>

        {/* ── MOBILE: Image band ───────────────────────── */}
        <motion.div
          variants={clipReveal('bottom', 0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="relative h-[40vh] min-h-[250px] lg:hidden"
        >
          <Image
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80"
            alt="Our Vaidya, B.A.M.S., M.D. (Ayu)"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: 'rgba(0, 107, 60,0.35)' }}
            aria-hidden
          />
        </motion.div>
      </div>
    </section>
  )
}
