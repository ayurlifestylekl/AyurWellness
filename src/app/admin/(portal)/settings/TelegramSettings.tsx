'use client'

import { useState, useTransition } from 'react'
import { Send, Search, Check } from 'lucide-react'
import { saveTelegramSettings, detectTelegramChatId } from '@/lib/admin/settings/actions'

export default function TelegramSettings({ initial }: { initial: { token: string | null; chatId: string | null } }) {
  const [token, setToken] = useState(initial.token ?? '')
  const [chatId, setChatId] = useState(initial.chatId ?? '')
  const [chats, setChats] = useState<{ id: string; title: string }[]>([])
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({})
  const [pending, start] = useTransition()

  const detect = () => {
    setMsg({})
    setChats([])
    start(async () => {
      const res = await detectTelegramChatId(token)
      if (!res.ok) setMsg({ err: res.error })
      else {
        setChats(res.data!.chats)
        if (res.data!.chats.length === 1) setChatId(res.data!.chats[0].id)
      }
    })
  }

  const save = () => {
    setMsg({})
    start(async () => {
      const res = await saveTelegramSettings({ token, chatId })
      setMsg(res.ok ? { ok: 'Telegram settings saved.' } : { err: res.error })
    })
  }

  const configured = !!(initial.token && initial.chatId)

  return (
    <section className="rounded-2xl border border-[#B58A3B]/30 bg-white p-6">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-[#006B3C]" />
        <h2 className="font-heading text-[15px] font-bold text-[#006B3C]">Telegram staff alerts</h2>
        {configured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 font-heading text-[9.5px] font-bold uppercase tracking-[0.1em] text-green-700">
            <Check className="h-3 w-3" /> Connected
          </span>
        )}
      </div>
      <p className="mt-1 font-body text-[12.5px] text-[#12372D]/60">
        Instant alerts to your staff Telegram group for new requests, payments and cancellations.
      </p>

      <ol className="mt-4 space-y-4">
        <li>
          <Label>1. Bot token (from BotFather)</Label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456789:AA…"
            className={inp}
            autoComplete="off"
            spellCheck={false}
          />
        </li>

        <li>
          <Label>2. Chat ID</Label>
          <p className="mb-1.5 font-body text-[12px] italic text-[#12372D]/55">
            Add the bot to your staff group and send <code>/start@YourBot</code> in it, then click Detect.
          </p>
          <div className="flex flex-wrap gap-2">
            <input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="-100…" className={`${inp} flex-1`} />
            <button
              type="button"
              onClick={detect}
              disabled={pending || !token.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#B58A3B]/40 px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#006B3C] hover:bg-[#EDF4E7] disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" /> Detect
            </button>
          </div>
          {chats.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="font-body text-[11.5px] text-[#12372D]/55">Pick your group:</p>
              {chats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChatId(c.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left font-body text-[13px] ${chatId === c.id ? 'border-[#006B3C] bg-[#EDF4E7]' : 'border-[#B58A3B]/25 hover:bg-[#EDF4E7]/60'}`}
                >
                  <span className="font-semibold text-[#006B3C]">{c.title}</span>
                  <span className="text-[#12372D]/50">{c.id}</span>
                </button>
              ))}
            </div>
          )}
        </li>
      </ol>

      {msg.err && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[12.5px] text-red-700">{msg.err}</p>}
      {msg.ok && <p className="mt-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2 font-body text-[12.5px] text-green-700">{msg.ok}</p>}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#006B3C] px-6 font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-[#006B3C]/90 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save Telegram settings'}
      </button>
    </section>
  )
}

const inp =
  'w-full rounded-lg border border-[#B58A3B]/30 bg-white px-3 py-2.5 font-body text-[14px] text-[#12372D] placeholder:text-[#12372D]/35 focus:border-[#006B3C] focus:outline-none focus:ring-1 focus:ring-[#006B3C]/30'

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-[#12372D]/55">{children}</span>
}
