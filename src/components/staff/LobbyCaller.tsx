'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Volume2 } from 'lucide-react'
import { announcement, newCalls, queueLabel, roomLabel, roomLabelMs, type QueueCall } from '@/lib/staff/queue'

const POLL_MS = 3000
const SHOW_MS = 10000
const GOLD = '#E4C384'

export interface LobbyGuest {
  id: string
  queueNo: number | null
  label: string
}

/**
 * The lobby TV. A full-screen board in the centre's colours: clock, the number
 * being served, the queue, and a scrolling message. It checks for new calls
 * every few seconds; each one takes over the screen with the number and room,
 * a chime, and a voice in English then Bahasa Malaysia. Browsers only allow
 * sound after a tap, so it starts with a "Start lobby screen" button.
 */
export default function LobbyScreen({ callsUrl, backHref, waiting, inTreatment }: { callsUrl: string; backHref: string; waiting: LobbyGuest[]; inTreatment: number }) {
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState<QueueCall | null>(null)
  const [recent, setRecent] = useState<QueueCall[]>([])
  const [offline, setOffline] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const lastSeen = useRef<string | null>(null)
  const pending = useRef<QueueCall[]>([])
  const busy = useRef(false)
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const chime = useCallback(() => {
    const ctx = audio.current
    if (!ctx) return
    ;[880, 660, 990].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.38
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.32, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 1.15)
    })
  }, [])

  const speak = useCallback((call: QueueCall) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    const voices = synth.getVoices()
    const en = voices.find((v) => /^en[-_](MY|SG|GB|AU|IN)/i.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang))
    // Malay voice if the TV has one (Indonesian is close enough); otherwise English only.
    const ms = voices.find((v) => /^ms/i.test(v.lang)) ?? voices.find((v) => /^id/i.test(v.lang))
    const text = announcement(call.queueNo, call.room)
    synth.cancel()
    const say = (words: string, voice: SpeechSynthesisVoice | undefined, lang: string) => {
      const u = new SpeechSynthesisUtterance(words)
      if (voice) u.voice = voice
      u.lang = voice?.lang ?? lang
      u.rate = 0.9
      synth.speak(u)
    }
    say(text.en, en, 'en-GB')
    if (ms) say(text.ms, ms, 'ms-MY')
  }, [])

  const showNext = useCallback(() => {
    if (busy.current) return
    const next = pending.current.shift()
    if (!next) return
    busy.current = true
    setCurrent(next)
    chime()
    setTimeout(() => speak(next), 1300)
    setTimeout(() => {
      setCurrent(null)
      busy.current = false
      showNext()
    }, SHOW_MS)
  }, [chime, speak])

  useEffect(() => {
    if (!started) return
    let stop = false
    const poll = async () => {
      try {
        const res = await fetch(callsUrl, { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const { calls } = (await res.json()) as { calls: QueueCall[] }
        setOffline(false)
        setRecent(calls.slice(0, 5))
        if (lastSeen.current === null) {
          // Calls made before the screen started are listed, not announced.
          lastSeen.current = calls[0]?.calledAt ?? new Date().toISOString()
          return
        }
        const fresh = newCalls(calls, lastSeen.current)
        if (fresh.length) {
          lastSeen.current = fresh[fresh.length - 1].calledAt
          pending.current.push(...fresh)
          showNext()
        }
      } catch {
        setOffline(true)
      }
    }
    poll()
    const id = setInterval(() => { if (!stop) poll() }, POLL_MS)
    return () => { stop = true; clearInterval(id) }
  }, [started, callsUrl, showNext])

  const start = async () => {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audio.current = new Ctx()
      await audio.current.resume()
    } catch {
      /* no sound on this device: the screen still shows the calls */
    }
    window.speechSynthesis?.getVoices()
    try { await (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<unknown> } }).wakeLock?.request('screen') } catch { /* ignore */ }
    try { await document.documentElement.requestFullscreen?.() } catch { /* ignore */ }
    setStarted(true)
  }

  const serving = recent[0] ?? null
  const earlier = recent.slice(1, 5)
  const queue = waiting.filter((g) => g.queueNo != null)
  const shownQueue = queue.slice(0, 8)

  return (
    <div className="lobby fixed inset-0 z-[70] flex flex-col overflow-hidden text-white" style={{ background: 'radial-gradient(1100px 700px at 12% 0%, rgba(181,138,59,0.22), transparent 60%), radial-gradient(900px 700px at 100% 100%, rgba(232,68,143,0.10), transparent 60%), linear-gradient(160deg, #0B2F23 0%, #12372D 55%, #0A261D 100%)' }}>
      <style>{`
        .lobby .ticker { animation: lobby-ticker 38s linear infinite; }
        .lobby .pulse-ring { animation: lobby-ring 2.4s ease-out infinite; }
        .lobby .pulse-ring.r2 { animation-delay: .8s } .lobby .pulse-ring.r3 { animation-delay: 1.6s }
        .lobby .call-in { animation: lobby-in .7s cubic-bezier(.2,.9,.25,1.15) both; }
        .lobby .serve-in { animation: lobby-fade .6s ease-out both; }
        @keyframes lobby-ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes lobby-ring { from { transform: scale(.6); opacity: .55 } to { transform: scale(1.8); opacity: 0 } }
        @keyframes lobby-in { from { transform: scale(.82); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes lobby-fade { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .lobby .ticker, .lobby .pulse-ring, .lobby .call-in, .lobby .serve-in { animation: none } }
      `}</style>

      {/* Faint lotus behind everything */}
      <Image src="/awc-icon.png" alt="" width={1090} height={890} priority className="pointer-events-none absolute -bottom-[12vh] -right-[8vw] h-[80vh] w-auto opacity-[0.05]" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-[4vw] pt-[3.5vh]">
        <div className="flex items-center gap-[1.4vw]">
          <Image src="/awc-icon.png" alt="" width={1090} height={890} className="h-[7vh] w-auto" />
          <div>
            <p className="font-heading text-[3vh] font-bold leading-tight">Ayurvedic Wellness Centre</p>
            <p className="font-heading text-[1.5vh] font-semibold uppercase tracking-[0.35em]" style={{ color: GOLD }}>Wellness · Heritage · Harmony</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-[6.5vh] font-extrabold leading-none tabular-nums">
            {now ? now.toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' }) : ''}
          </p>
          <p className="mt-[0.6vh] font-body text-[1.9vh] text-white/70">
            {now ? `${now.toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'long', day: 'numeric', month: 'long' })} · ${now.toLocaleDateString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'long' })}` : ''}
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="relative grid min-h-0 flex-1 grid-cols-[1.55fr_1fr] gap-[3vw] px-[4vw] py-[4vh]">
        <section className="flex min-h-0 flex-col">
          <Label en="Now serving" ms="Sedang dilayan" />
          {serving ? (
            <div key={`${serving.id}-${serving.calledAt}`} className="serve-in relative mt-[2.2vh] flex flex-1 flex-col items-center justify-center rounded-[3vh] border-2 px-[2vw]" style={{ borderColor: 'rgba(228,195,132,0.55)', background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))', boxShadow: '0 0 80px -20px rgba(228,195,132,0.45), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
              <p className="font-heading text-[2vh] font-bold uppercase tracking-[0.4em] text-white/60">Number · Nombor</p>
              <p className="font-heading text-[26vh] font-extrabold leading-[0.95] tabular-nums" style={{ color: GOLD, textShadow: '0 0 60px rgba(228,195,132,0.35)' }}>{queueLabel(serving.queueNo)}</p>
              <RoomPill room={serving.room} size="lg" />
            </div>
          ) : (
            <div className="mt-[2.2vh] flex flex-1 flex-col items-center justify-center rounded-[3vh] border border-white/10 bg-white/[0.04] text-center">
              <Image src="/awc-icon.png" alt="" width={1090} height={890} className="h-[14vh] w-auto opacity-90" />
              <p className="mt-[3vh] font-display text-[6vh] italic">Welcome · Selamat datang</p>
              <p className="mt-[1.5vh] font-body text-[2.4vh] text-white/65">Your number will appear here when it’s your turn.</p>
            </div>
          )}

          {earlier.length > 0 && (
            <div className="mt-[3vh]">
              <Label en="Recently called" ms="Panggilan terdahulu" small />
              <ul className="mt-[1.4vh] grid grid-cols-4 gap-[1.2vw]">
                {earlier.map((c) => (
                  <li key={`${c.id}-${c.calledAt}`} className="rounded-[1.8vh] border border-white/10 bg-white/[0.06] px-[1vw] py-[1.6vh] text-center">
                    <p className="font-heading text-[5.5vh] font-extrabold leading-none tabular-nums">{queueLabel(c.queueNo)}</p>
                    <p className="mt-[0.8vh] truncate font-body text-[1.8vh] text-white/60">{roomLabel(c.room) ?? 'Front desk'}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="flex min-h-0 flex-col rounded-[3vh] border border-white/10 bg-white/[0.05] p-[2.6vh] backdrop-blur">
          <Label en="Waiting" ms="Menunggu" />
          {shownQueue.length === 0 ? (
            <p className="mt-[3vh] font-body text-[2.6vh] text-white/50">No one waiting right now.</p>
          ) : (
            <ol className="mt-[2vh] flex-1 space-y-[1.3vh] overflow-hidden">
              {shownQueue.map((g, i) => (
                <li key={g.id} className={`flex items-center gap-[1.2vw] rounded-[1.6vh] px-[1.2vw] py-[1.2vh] ${i === 0 ? 'bg-white/[0.10]' : 'bg-white/[0.04]'}`}>
                  <span className="flex h-[6vh] w-[6vh] shrink-0 items-center justify-center rounded-[1.4vh] border-2 font-heading text-[3vh] font-extrabold tabular-nums" style={{ borderColor: GOLD, color: GOLD }}>{queueLabel(g.queueNo)}</span>
                  <span className="truncate font-heading text-[2.9vh] font-semibold">{g.label}</span>
                  {i === 0 && <span className="ml-auto shrink-0 rounded-full px-[0.9vw] py-[0.4vh] font-heading text-[1.5vh] font-bold uppercase tracking-[0.15em] text-[#12372D]" style={{ background: GOLD }}>Next</span>}
                </li>
              ))}
            </ol>
          )}
          <p className="mt-[2vh] border-t border-white/10 pt-[1.6vh] font-body text-[2vh] text-white/60">
            {queue.length > shownQueue.length ? `+ ${queue.length - shownQueue.length} more waiting · ` : ''}{inTreatment} in treatment now · {inTreatment} sedang dirawat
          </p>
        </aside>
      </main>

      {/* Scrolling message */}
      <footer className="relative border-t py-[1.6vh]" style={{ borderColor: 'rgba(228,195,132,0.35)', background: 'rgba(0,0,0,0.18)' }}>
        <div className="flex w-max ticker whitespace-nowrap font-body text-[2.3vh] text-white/75">
          {[0, 1].map((k) => (
            <span key={k} className="flex items-center">
              {['Please keep your queue number ready', 'Sila sediakan nombor giliran anda', 'Thank you for choosing Ayurvedic Wellness Centre', 'Terima kasih kerana memilih kami', 'Please switch your phone to silent', 'Sila senyapkan telefon anda'].map((t) => (
                <span key={t} className="flex items-center">
                  <span className="px-[2.5vw]">{t}</span>
                  <span style={{ color: GOLD }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
        {offline && <p className="absolute right-[4vw] top-1/2 -translate-y-1/2 rounded-full bg-amber-500/90 px-[1vw] py-[0.4vh] font-body text-[1.6vh] text-black">Not connected: check the internet and that this screen is signed in</p>}
      </footer>

      {/* The call */}
      {current && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" role="status" aria-live="assertive" style={{ background: 'radial-gradient(900px 700px at 50% 50%, rgba(181,138,59,0.35), transparent 65%), linear-gradient(160deg, #0B2F23, #0A261D)' }}>
          <div className="call-in flex flex-col items-center">
            <p className="font-heading text-[3.4vh] font-bold uppercase tracking-[0.45em]" style={{ color: GOLD }}>Now calling · Nombor dipanggil</p>
            <div className="relative my-[3vh] flex items-center justify-center">
              {['', 'r2', 'r3'].map((r) => (
                <span key={r} className={`pulse-ring ${r} absolute h-[42vh] w-[42vh] rounded-full border-2`} style={{ borderColor: 'rgba(228,195,132,0.6)' }} />
              ))}
              <span className="relative flex h-[46vh] w-[46vh] items-center justify-center rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.10), rgba(255,255,255,0.02))', boxShadow: '0 0 120px -10px rgba(228,195,132,0.6), inset 0 0 0 2px rgba(228,195,132,0.7)' }}>
                <span className="font-heading text-[24vh] font-extrabold leading-none tabular-nums" style={{ color: GOLD, textShadow: '0 0 50px rgba(228,195,132,0.45)' }}>{queueLabel(current.queueNo)}</span>
              </span>
            </div>
            <RoomPill room={current.room} size="xl" />
          </div>
        </div>
      )}

      {/* Start: a tap turns on the sound */}
      {!started && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-[3vh] p-6 text-center" style={{ background: 'linear-gradient(160deg, #0B2F23, #12372D)' }}>
          <Image src="/awc-icon.png" alt="" width={1090} height={890} className="h-[16vh] w-auto" />
          <h1 className="font-heading text-[5vh] font-extrabold">Lobby screen</h1>
          <p className="max-w-[60vw] font-body text-[2.4vh] text-white/75">Tap once to start. This turns on the sound for calling numbers and keeps the screen awake.</p>
          <button type="button" onClick={start} className="inline-flex items-center gap-3 rounded-[2vh] px-[3vw] py-[2.2vh] font-heading text-[2.6vh] font-extrabold uppercase tracking-[0.14em] text-[#12372D] shadow-gold-glow transition-transform hover:scale-[1.03]" style={{ background: GOLD }}>
            <Volume2 className="h-[3vh] w-[3vh]" aria-hidden /> Start lobby screen
          </button>
          <Link href={backHref} className="font-body text-[1.8vh] text-white/45 underline">Back to the staff view</Link>
        </div>
      )}
    </div>
  )
}

function Label({ en, ms, small }: { en: string; ms: string; small?: boolean }) {
  return (
    <p className={`flex items-center gap-[1vw] font-heading font-bold uppercase tracking-[0.3em] ${small ? 'text-[1.7vh]' : 'text-[2.2vh]'}`}>
      <span style={{ color: GOLD }}>{en}</span>
      <span className="h-px w-[2vw] bg-white/25" aria-hidden />
      <span className="text-white/55">{ms}</span>
    </p>
  )
}

function RoomPill({ room, size }: { room: string | null; size: 'lg' | 'xl' }) {
  const en = roomLabel(room) ?? 'Front desk'
  const ms = roomLabelMs(room) ?? 'Kaunter'
  return (
    <p className={`mt-[1.5vh] inline-flex items-center gap-[1vw] rounded-full border border-white/20 bg-white/10 font-heading font-bold ${size === 'xl' ? 'px-[2.4vw] py-[1.6vh] text-[5.5vh]' : 'px-[2vw] py-[1.2vh] text-[4vh]'}`}>
      <span style={{ color: GOLD }}>→</span> {en}
      {ms !== en && <span className="font-semibold text-white/55">· {ms}</span>}
    </p>
  )
}
