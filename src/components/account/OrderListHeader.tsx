export default function OrderListHeader() {
  return (
    <header>
      <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
        Order History
      </span>
      <h1
        className="mt-1.5 font-heading text-[26px] font-bold leading-tight text-[#006B3C] sm:text-[30px]"
        style={{ letterSpacing: '-0.02em' }}
      >
        My Orders.
      </h1>
      <p
        className="mt-1.5 max-w-2xl font-body text-[13px] text-[#12372D]/60"
        style={{ lineHeight: 1.6 }}
      >
        Every order, receipt, and shipment in one place — with live tracking from the courier.
      </p>
    </header>
  )
}
