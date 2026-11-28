'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A finger / stylus / mouse signature box for the counter tablet. Calls
 * onChange with a PNG data URL after each stroke (null when cleared).
 */
export default function SignaturePad({ onChange, height = 200 }: { onChange: (dataUrl: string | null) => void; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [empty, setEmpty] = useState(true)

  // Size the drawing surface to the box (sharp on high-density tablet screens).
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ratio = Math.max(1, window.devicePixelRatio || 1)
    const w = c.clientWidth
    c.width = w * ratio
    c.height = height * ratio
    const ctx = c.getContext('2d')!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }, [height])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = point(e)
    const ctx = e.currentTarget.getContext('2d')!
    ctx.beginPath()
    ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2)
    ctx.fillStyle = '#111827'
    ctx.fill()
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return
    const p = point(e)
    const ctx = e.currentTarget.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    // Midpoint smoothing keeps fast strokes from looking jagged.
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 }
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    setEmpty(false)
    onChange(canvasRef.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = canvasRef.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-accent/40 bg-white">
        <canvas
          ref={canvasRef}
          style={{ height, touchAction: 'none' }}
          className="block w-full cursor-crosshair rounded-xl"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
          aria-label="Signature box — sign with your finger"
        />
        {empty && <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-body text-[14px] italic text-dark/35">Sign here</span>}
        <span className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-dark/25" />
      </div>
      <button type="button" onClick={clear} className="mt-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-dark/55 hover:text-primary">
        Clear
      </button>
    </div>
  )
}
