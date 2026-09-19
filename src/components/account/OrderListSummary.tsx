import { Package, Wallet, Sprout } from 'lucide-react'
import StatTile from './StatTile'

interface OrderListSummaryProps {
  totalOrders: number
  totalSpent: number
  memberSinceLabel: string
}

export default function OrderListSummary({
  totalOrders,
  totalSpent,
  memberSinceLabel,
}: OrderListSummaryProps) {
  return (
    <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
      <StatTile
        label="Total orders"
        value={String(totalOrders)}
        sub={totalOrders === 0 ? 'No orders yet' : totalOrders === 1 ? '1 order placed' : `${totalOrders} orders placed`}
        icon={Package}
        accent="sage"
      />
      <StatTile
        label="Total spent"
        value={`RM ${totalSpent.toFixed(2)}`}
        sub="Across paid orders"
        icon={Wallet}
        accent="gold"
      />
      <StatTile
        label="Member since"
        value={memberSinceLabel}
        sub="Welcome to the practice"
        icon={Sprout}
        accent="olive"
      />
    </section>
  )
}
