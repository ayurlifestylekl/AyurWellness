import Link from 'next/link'
import ProductForm from './ProductForm'

export const metadata = { title: 'New Product · Admin' }

export default function NewProductPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/admin/products"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to products
      </Link>
      <header>
        <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">New product</h1>
        <p className="mt-1 text-[12.5px] text-[#12372D]/65">
          Fill in the catalog details. You can upload images and manage bundle components on
          the edit page after the product is created.
        </p>
      </header>
      <ProductForm mode="create" />
    </div>
  )
}
