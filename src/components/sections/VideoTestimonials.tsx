'use client'

import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Volume2, VolumeX } from 'lucide-react'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

/* ── Palette ── */
const EMERALD       = '#75B843'
const EMERALD_DEEP  = '#149447'
const SAFFRON       = '#B58A3B'
const SAFFRON_SOFT  = '#B58A3B'
const TERRACOTTA    = '#B58A3B'   // warm pop on dark — more vibrant than saffron alone

type VideoTestimonial = {
  id: string
  chapter: string
  videoSrc: string
  posterImage: string
  author: string
  ritual: string
  location: string
  duration: string
}

const testimonials: VideoTestimonial[] = [
  {
    id: 'andrea',
    chapter: 'I',
    videoSrc: '/videos/andrea.mp4',
    posterImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80',
    author: 'Andrea',
    ritual: 'Shirodhara — 21 days',
    location: 'Kuala Lumpur',
    duration: '01:24',
  },
  {
    id: 'liliana',
    chapter: 'II',
    videoSrc: '/videos/liliana.mp4',
    posterImage: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?auto=format&fit=crop&w=600&q=80',
    author: 'Liliana',
    ritual: 'Abhyanga ritual',
    location: 'Petaling Jaya',
    duration: '01:48',
  },
  {
    id: 'mani',
    chapter: 'III',
    videoSrc: '/videos/mani.mp4',
    posterImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    author: 'Mani',
    ritual: 'Panchakarma cleanse',
    location: 'Penang',
    duration: '02:12',
  },
  {
    id: 'yoshie',
    chapter: 'IV',
    videoSrc: '/videos/yoshie.mp4',
    posterImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
    author: 'Yoshie',
    ritual: 'Netra tarpana',
    location: 'Bangsar',
    duration: '00:58',
  },
]

export default function VideoTestimonials() {
  return (
    <section
      className="relative overflow-hidden py-10 sm:py-12 lg:py-14"
      style={{
        background: `linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DEEP} 100%)`,
      }}
    >
      {/* Vibrant warm corner glows on the dark base */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 70% at -5% 10%, rgba(181, 138, 59,0.20), transparent 60%), radial-gradient(ellipse 50% 60% at 105% 90%, rgba(181, 138, 59,0.22), transparent 60%)',
        }}
      />

      {/* Subtle grain texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />

      {/* Top + bottom saffron hairlines */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent 4%, rgba(181, 138, 59,0.50) 50%, transparent 96%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent 4%, rgba(181, 138, 59,0.40) 50%, transparent 96%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">

        {/* ── COMPACT INLINE HEADER ── single row on desktop */}
        <motion.header
          variants={staggerParent(0.09, 0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="grid grid-cols-1 items-end gap-y-4 lg:grid-cols-12 lg:gap-x-8"
        >
          {/* Title block */}
          <div className="lg:col-span-7">
            <motion.div variants={fadeUp(0)} className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block h-px w-10"
                style={{ backgroundColor: TERRACOTTA, opacity: 0.7 }}
              />
              <span
                className="font-heading text-[10px] font-bold uppercase tracking-[0.4em] sm:text-[11px]"
                style={{ color: TERRACOTTA }}
              >
                The Guest Film{' '}
                <span style={{ color: `${TERRACOTTA}55` }} className="mx-1">·</span>{' '}
                Vol. I
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp(0)}
              className="mt-3 flex flex-wrap items-baseline gap-x-3"
            >
              <span
                className="font-heading font-extrabold text-white"
                style={{
                  fontSize: 'clamp(1.75rem, 3.6vw, 2.75rem)',
                  lineHeight: 1.0,
                  letterSpacing: '-0.025em',
                }}
              >
                Quiet rituals,
              </span>
              <span
                className="font-display italic"
                style={{
                  color: SAFFRON,
                  fontSize: 'clamp(1.9rem, 4vw, 3.1rem)',
                  lineHeight: 1.0,
                  letterSpacing: '-0.015em',
                  textShadow: '0 3px 22px rgba(181, 138, 59,0.32)',
                }}
              >
                remembered.
              </span>
            </motion.h2>
          </div>

          {/* Byline + dateline — high contrast on dark */}
          <div className="lg:col-span-5 lg:border-l lg:pl-6" style={{ borderColor: `${SAFFRON}33` }}>
            <motion.p
              variants={fadeUp(0)}
              className="font-body leading-[1.55] text-white/90"
              style={{ fontSize: 'clamp(13px, 0.95vw, 15px)' }}
            >
              Four guests. Four journeys under our{' '}
              <span className="font-semibold text-white">certified Vaidyas</span>{' '}
              — filmed in stillness.
            </motion.p>

            <motion.div variants={fadeUp(0)} className="mt-2.5 flex items-center gap-3">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rotate-45"
                style={{ backgroundColor: SAFFRON }}
              />
              <span
                className="font-heading text-[10px] font-bold uppercase tracking-[0.32em]"
                style={{ color: SAFFRON_SOFT }}
              >
                Spring 2026 · Brickfields, KL
              </span>
            </motion.div>
          </div>
        </motion.header>

        {/* ── 4 EQUAL FILM CARDS — compact 4:5 aspect ── */}
        <motion.div
          variants={staggerParent(0.09, 0.15)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="no-scrollbar -mx-5 mt-7 flex w-[calc(100%+2.5rem)] gap-4 overflow-x-auto px-5 pb-2 snap-x snap-mandatory sm:mx-0 sm:w-full sm:gap-5 sm:px-0 lg:mt-8 lg:grid lg:grid-cols-4 xl:gap-6 lg:pb-0"
        >
          {testimonials.map((item, idx) => (
            <motion.div
              key={item.id}
              variants={fadeUp(0)}
              className="w-[230px] flex-shrink-0 snap-center sm:w-[250px] lg:w-auto"
            >
              <VideoCard item={item} index={idx} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function VideoCard({ item, index }: { item: VideoTestimonial; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  return (
    <article className="group relative flex flex-col">
      <div
        className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-[14px] bg-black ring-1 ring-white/10 transition-[transform,box-shadow,ring] duration-700 ease-[cubic-bezier(0.22,0.92,0.38,1)] will-change-transform hover:-translate-y-1.5"
        onClick={togglePlay}
        style={{
          boxShadow:
            '0 22px 50px -22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 26px 60px -22px rgba(0,0,0,0.65), 0 0 0 1px ${SAFFRON}45, inset 0 1px 0 rgba(255,255,255,0.05)`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 22px 50px -22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
      >
        <video
          ref={videoRef}
          src={item.videoSrc}
          poster={item.posterImage}
          playsInline
          loop
          muted={isMuted}
          preload="metadata"
          className={`h-full w-full object-cover transition-[transform,opacity] duration-[1800ms] ease-out ${
            isPlaying
              ? 'scale-100 opacity-100'
              : 'scale-[1.04] opacity-90 group-hover:scale-[1.015] group-hover:opacity-100'
          }`}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Vignette */}
        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-700 ${
            isPlaying ? 'opacity-25' : 'opacity-85'
          }`}
          style={{
            background:
              'linear-gradient(to top, rgba(18,55,45,0.92) 0%, rgba(18,55,45,0.30) 50%, rgba(18,55,45,0.10) 100%)',
          }}
        />

        {/* Hover saffron glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(181, 138, 59,0.22) 0%, transparent 70%)',
          }}
        />

        {/* Chapter badge */}
        <div
          className={`absolute left-4 top-4 z-10 flex flex-col gap-0.5 transition-all duration-700 ${
            isPlaying ? 'translate-y-[-6px] opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <span
            className="font-heading text-[9px] font-bold uppercase tracking-[0.5em]"
            style={{ color: SAFFRON_SOFT }}
          >
            Film
          </span>
          <span className="font-display text-[18px] italic font-normal leading-none tracking-[-0.04em] text-white/95">
            {String(index + 1).padStart(2, '0')}
            <span className="mx-1 text-white/35 not-italic">/</span>
            <span className="text-white/45 not-italic">04</span>
          </span>
        </div>

        {/* Play marker */}
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-all duration-700 ease-out ${
            isPlaying ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <div
            className="relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-black/35 backdrop-blur-md transition-all duration-500"
            style={{ border: `1px solid ${SAFFRON}66` }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = SAFFRON
              ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0.5)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 6px ${SAFFRON}1a`
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = `${SAFFRON}66`
              ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0.35)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
            }}
          >
            <Play
              className="ml-[2px] h-3.5 w-3.5 fill-white/95 text-white/95"
              strokeWidth={1}
            />
          </div>
        </div>

        {/* Bottom text */}
        <div
          className={`absolute inset-x-0 bottom-0 z-10 px-4 pb-4 transition-all duration-700 ease-out ${
            isPlaying ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100 group-hover:-translate-y-0.5'
          }`}
        >
          <span
            aria-hidden
            className="mb-1.5 block h-px w-5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
            style={{ backgroundColor: SAFFRON }}
          />
          <h3 className="font-heading text-[17px] font-extrabold leading-none tracking-[-0.015em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {item.author}
          </h3>
          <p
            className="mt-1 font-display italic leading-snug"
            style={{ color: SAFFRON_SOFT, fontSize: '11.5px' }}
          >
            {item.ritual}
          </p>
          <p className="mt-1 font-heading text-[9px] font-bold uppercase tracking-[0.28em] text-white/55">
            {item.location} · {item.duration}
          </p>
        </div>

        {/* Audio toggle */}
        {isPlaying && (
          <button
            onClick={toggleMute}
            className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/65"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="h-3 w-3" strokeWidth={1.5} /> : <Volume2 className="h-3 w-3" strokeWidth={1.5} />}
          </button>
        )}
      </div>
    </article>
  )
}
