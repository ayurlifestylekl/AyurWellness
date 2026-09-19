import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react'
import {
  CLINIC_ADDRESS,
  CLINIC_EMAIL,
  CLINIC_HOURS,
  CLINIC_LONG_NAME,
  CLINIC_MAPS_URL,
  CLINIC_PHONE_PRIMARY,
  mailtoLink,
  telLink,
} from '@/lib/clinic'

export default function ClinicInfoCard() {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#006B3C]/6 px-5 py-3 sm:px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
          <MapPin className="h-3.5 w-3.5 text-[#006B3C]" strokeWidth={1.8} />
        </span>
        <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
          The Vaidyasalai
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {/* Address */}
        <div>
          <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
            Visit us
          </p>
          <p
            className="mt-2 font-heading text-[13px] font-bold text-[#006B3C]"
            style={{ letterSpacing: '-0.005em' }}
          >
            {CLINIC_LONG_NAME}
          </p>
          <p className="mt-1 font-body text-[12px] text-[#12372D]/65" style={{ lineHeight: 1.55 }}>
            {CLINIC_ADDRESS}
          </p>
          <a
            href={CLINIC_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#B58A3B] transition-colors hover:text-[#B58A3B]"
          >
            Open in Maps
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </a>
        </div>

        {/* Hours */}
        <div>
          <p className="inline-flex items-center gap-1.5 font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
            <Clock className="h-3 w-3" strokeWidth={2} />
            Hours
          </p>
          <ul className="mt-2 space-y-1">
            {CLINIC_HOURS.map((h) => (
              <li
                key={h.day}
                className="flex items-center justify-between font-body text-[12px] text-[#12372D]/75"
              >
                <span className="font-heading font-semibold text-[#006B3C]/80">
                  {h.day}
                </span>
                <span>{h.hours}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Phones + email */}
        <div>
          <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
            Reach the clinic
          </p>
          <ul className="mt-2 space-y-2">
            <li>
              <a
                href={telLink(CLINIC_PHONE_PRIMARY)}
                className="inline-flex items-center gap-2 font-heading text-[12.5px] font-semibold text-[#006B3C] hover:text-[#B58A3B]"
              >
                <Phone className="h-3 w-3" strokeWidth={2} />
                {CLINIC_PHONE_PRIMARY}
              </a>
            </li>
            <li>
              <a
                href={mailtoLink()}
                className="inline-flex items-center gap-2 font-body text-[12px] text-[#12372D]/65 hover:text-[#B58A3B]"
              >
                <Mail className="h-3 w-3" strokeWidth={2} />
                {CLINIC_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
