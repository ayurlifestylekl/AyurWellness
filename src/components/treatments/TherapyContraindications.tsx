interface TherapyContraindicationsProps {
  text: string
}

export default function TherapyContraindications({ text }: TherapyContraindicationsProps) {
  if (!text) return null
  return (
    <div className="rounded-r border-l-[3px] border-accent bg-accent/10 px-5 py-4">
      <div className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
        Please book a consultation if you have
      </div>
      <p className="mt-2 font-body text-[14px] leading-[1.6] text-dark/75">
        {text}
      </p>
    </div>
  )
}
