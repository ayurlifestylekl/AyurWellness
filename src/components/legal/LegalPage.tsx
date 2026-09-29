import { CLINIC_ADDRESS, CLINIC_EMAIL, CLINIC_LEGAL_NAME, CLINIC_PHONE_PRIMARY, CLINIC_REG_NO } from '@/lib/clinic'

export interface LegalSection {
  heading: string
  body: React.ReactNode
}

export default function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string
  title: string
  intro: React.ReactNode
  updated: string
  sections: LegalSection[]
}) {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-8 md:py-20">
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</span>
        <h1 className="mt-3 font-heading text-[32px] font-bold leading-tight text-primary sm:text-[42px]" style={{ letterSpacing: '-0.025em' }}>
          {title}
        </h1>
        <p className="mt-2 font-body text-[13px] text-dark/50">Last updated {updated}</p>
        <div className="mt-5 font-body text-[15px] leading-relaxed text-dark/70">{intro}</div>

        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="font-heading text-[18px] font-bold text-primary">
                <span className="mr-2 text-accent">{i + 1}.</span>
                {s.heading}
              </h2>
              <div className="mt-2 space-y-3 font-body text-[14.5px] leading-relaxed text-dark/70 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-accent/15 bg-white/70 p-5 font-body text-[13.5px] leading-relaxed text-dark/65 sm:p-6">
          <p className="font-heading text-[14px] font-bold text-primary">{CLINIC_LEGAL_NAME}</p>
          <p>Registration No. {CLINIC_REG_NO}</p>
          <p>{CLINIC_ADDRESS}</p>
          <p>
            {CLINIC_PHONE_PRIMARY} · {CLINIC_EMAIL}
          </p>
        </div>
      </div>
    </main>
  )
}
