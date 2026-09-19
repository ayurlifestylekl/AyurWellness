import {
  Sparkles,
  PillBottle,
  Calendar,
  Package,
  Receipt,
  MessageCircle,
  Sprout,
  type LucideIcon,
} from 'lucide-react'
import { topicLabel } from '@/lib/support/format'
import type { TopicKey } from '@/lib/support/format'

interface TicketTopicChipProps {
  topic: TopicKey
}

const ICONS: Record<TopicKey, LucideIcon> = {
  treatment: Sparkles,
  prescription: PillBottle,
  appointment: Calendar,
  order: Package,
  billing: Receipt,
  welcome: Sprout,
  other: MessageCircle,
}

export default function TicketTopicChip({ topic }: TicketTopicChipProps) {
  const Icon = ICONS[topic] ?? MessageCircle
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#006B3C]/[0.06] px-2.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-[#006B3C]/65">
      <Icon className="h-2.5 w-2.5" strokeWidth={2} />
      {topicLabel(topic)}
    </span>
  )
}
