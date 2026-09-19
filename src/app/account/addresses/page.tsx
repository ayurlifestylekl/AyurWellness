import { MapPin } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listAddresses } from '@/lib/addresses/queries'
import AddressBookCard from '@/components/account/AddressBookCard'
import AddressForm from '@/components/account/AddressForm'

export const metadata = { title: 'Saved addresses' }

export default async function AddressesPage() {
  const me = await getCurrentUser()
  const supabase = await createClient()
  const addresses = me ? await listAddresses(supabase, me.authId) : []

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:gap-7">
      <header>
        <span className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          <MapPin className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2} />
          Saved addresses
        </span>
        <h1
          className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C] sm:text-[36px]"
          style={{ letterSpacing: '-0.025em' }}
        >
          Where do we send your{' '}
          <span
            className="italic font-normal text-[#006B3C]/70"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            herbs?
          </span>
        </h1>
        <p className="mt-3 max-w-xl font-body text-[14px] text-[#12372D]/65" style={{ lineHeight: 1.65 }}>
          Save shipping addresses for faster checkout. Your default address is used unless you pick another at order time.
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          Your addresses
        </h2>
        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {addresses.map((a) => (
              <AddressBookCard key={a.id} address={a} />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-[#006B3C]/15 bg-white px-5 py-6 text-center font-body text-[13px] italic text-[#12372D]/55">
            No addresses saved yet. Add your first below.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          Add a new address
        </h2>
        <AddressForm />
      </section>
    </div>
  )
}
