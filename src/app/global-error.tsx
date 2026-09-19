'use client'

/**
 * Last-resort boundary for errors thrown in the root layout itself.
 * It replaces the whole document, so styles are inlined (global CSS may not
 * have loaded). Keeps the app from ever showing a blank white screen.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Georgia, "Times New Roman", serif', background: '#EDF4E7', color: '#12372D' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.28em', color: '#B58A3B' }}>
            Ayurvedic Wellness Centre
          </div>
          <h1 style={{ marginTop: 16, fontSize: 30, fontWeight: 800, color: '#006B3C' }}>Something went wrong.</h1>
          <p style={{ marginTop: 12, maxWidth: 440, fontSize: 15, lineHeight: 1.6, color: 'rgba(18,55,45,0.65)' }}>
            A hiccup on our side — please try again in a moment.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 28,
              borderRadius: 999,
              background: '#006B3C',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              fontFamily: 'Arial, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
