import QRCode from 'qrcode'

/**
 * Server component — renders a QR for the share link as an inline data URL.
 * Generated once per render, no client JS needed.
 */
export default async function ReferralQR({
  value,
  size = 128,
}: {
  value: string
  size?: number
}) {
  let dataUrl = ''
  try {
    dataUrl = await QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#12372D',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
  } catch {
    return null
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Referral QR code"
      width={size}
      height={size}
      className="rounded-lg bg-white p-1.5"
    />
  )
}
