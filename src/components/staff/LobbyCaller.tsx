'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { announcement, newCalls, queueLabel, roomLabel, type QueueCall } from '@/lib/staff/queue'

const POLL_MS = 3000
const SHOW_MS = 10000

/**
 * The lobby TV's caller. It checks for new calls every few seconds; each new
 * call fills the screen with the number and room, plays a chime and says it in
 * English, then Bahasa Malaysia. Browsers only allow sound after a tap, so the
 * screen starts with a "Start lobby screen" button.
 */
export default function LobbyCaller({ callsUrl }: { callsUrl: string }) {
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState<QueueCall | null>(null)
  const [recent, setRecent] = useState<QueueCall[]>([])
  const [offline, setOffline] = useState(false)
  const lastSeen = useRef<string | null>(null)
  const pending = useRef<QueueCall[]>([])
  const busy = useRef(false)
  const audio = useRef<AudioContext | null>(null)

  const chime = useCallback(() => {
    const ctx = audio.current
    if (!ctx) return
    ;[880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.45
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.95)
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
    setTimeout(() => speak(next), 1100)
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
    // Load the voices list, keep the TV awake and fill the screen where allowed.
    window.speechSynthesis?.getVoices()
    try { await (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<unknown> } }).wakeLock?.request('screen') } catch { /* ignore */ }
    try { await document.documentElement.requestFullscreen?.() } catch { /* ignore */ }
    setStarted(true)
  }

  if (!started) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-primary/95 p-6 text-center text-white">
        <Volume2 className="h-14 w-14 text-[#E4C384]" aria-hidden />
        <p className="max-w-md font-body text-[18px] text-white/85">Tap once to start the lobby screen. This turns on the sound for calling numbers.</p>
        <button type="button" onClick={start} className="rounded-2xl bg-[#E4C384] px-10 py-5 font-heading text-[18px] font-extrabold uppercase tracking-[0.12em] text-primary hover:bg-[#f0d49d]">
          Start lobby screen
        </button>
      </div>
    )
  }

  return (
    <>
      <aside className="mt-8 rounded-2xl bg-white/10 p-5" aria-label="Recently called">
        <h2 className="font-heading text-[16px] font-bold uppercase tracking-[0.14em] text-white/70">Recently called</h2>
        {recent.length === 0 ? (
          <p className="mt-3 font-body text-[20px] text-white/50">—</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-3">
            {recent.map((c) => (
              <li key={`${c.id}-${c.calledAt}`} className="rounded-xl bg-white/10 px-4 py-2 font-heading text-[24px] font-extrabold">
                {queueLabel(c.queueNo)}
                {roomLabel(c.room) && <span className="ml-2 font-body text-[16px] font-normal text-white/70">→ {roomLabel(c.room)}</span>}
              </li>
            ))}
          </ul>
        )}
        {offline && <p className="mt-3 font-body text-[13px] text-amber-200">Can’t reach the system: check the internet connection and that this screen is still signed in.</p>}
      </aside>

      {current && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-primary text-white" role="alert" aria-live="assertive">
          <p className="font-heading text-[clamp(22px,4vw,44px)] font-bold uppercase tracking-[0.2em] text-[#E4C384]">Now calling · Nombor dipanggil</p>
          <p className="animate-pulse font-heading text-[clamp(120px,28vw,360px)] font-extrabold leading-none">{queueLabel(current.queueNo)}</p>
          <p className="mt-4 font-heading text-[clamp(28px,6vw,72px)] font-bold">{roomLabel(current.room) ?? 'Front desk'}</p>
        </div>
      )}
    </>
  )
}
