interface Item {
  id: string
  quantity: number
  price_at_purchase_rm: number
  product: { id: string; name: string; sku: string | null; image_url: string | null } | null
}

export default function OrderItemsTable({ items }: { items: Item[] }) {
  const total = items.reduce(
    (s, i) => s + Number(i.price_at_purchase_rm) * i.quantity,
    0,
  )
  return (
    <div className="overflow-x-auto">
    <table className="min-w-[640px] w-full text-left text-[13px]">
      <thead className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
        <tr>
          <th className="px-5 py-3">Item</th>
          <th className="px-5 py-3">SKU</th>
          <th className="px-5 py-3 text-right">Qty</th>
          <th className="px-5 py-3 text-right">Unit</th>
          <th className="px-5 py-3 text-right">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#006B3C]/6">
        {items.map((it) => (
          <tr key={it.id}>
            <td className="px-5 py-3">{it.product?.name ?? '—'}</td>
            <td className="px-5 py-3 text-[11px] text-[#12372D]/65">
              {it.product?.sku ?? '—'}
            </td>
            <td className="px-5 py-3 text-right">{it.quantity}</td>
            <td className="px-5 py-3 text-right">
              RM {Number(it.price_at_purchase_rm).toFixed(2)}
            </td>
            <td className="px-5 py-3 text-right font-semibold">
              RM {(Number(it.price_at_purchase_rm) * it.quantity).toFixed(2)}
            </td>
          </tr>
        ))}
        <tr className="bg-[#EDF4E7]/40">
          <td colSpan={4} className="px-5 py-3 text-right font-semibold text-[#006B3C]">
            Items total
          </td>
          <td className="px-5 py-3 text-right font-semibold text-[#006B3C]">
            RM {total.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  )
}
