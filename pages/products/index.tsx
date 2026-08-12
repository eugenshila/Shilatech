import ProductCard from '../../components/ProductCard'
import { useState } from 'react'
import type { GetStaticProps } from 'next'
import { getAllProducts } from '../../lib/db.wire'

type Product = {
  sku: string
  slug: string
  name: string
  brand?: string
  category?: string
  part_number?: string
  oem_number?: string
  price?: number
  featured?: boolean
}

export default function Products({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')

  const filtered = (products || []).filter((p: any) => {
    const q = query.toLowerCase()
    const matchesQuery =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      (p.part_number || '').toLowerCase().includes(q) ||
      (p.oem_number || '').toLowerCase().includes(q)
    const matchesBrand = !brand || p.brand === brand
    const matchesCategory = !category || p.category === category
    return matchesQuery && matchesBrand && matchesCategory
  })

  const brands = Array.from(new Set((products || []).map((p: any) => p.brand).filter(Boolean)))
  const categories = Array.from(new Set((products || []).map((p: any) => p.category).filter(Boolean)))

  return (
    <div className="pt-24 max-w-6xl mx-auto px-4 pb-24">
      <h1 className="text-3xl font-semibold mt-8">Spare Parts Catalogue</h1>

      <div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by part number, vehicle model or spare part..." className="w-full md:w-1/2 p-3 rounded-md bg-neutral-900 border border-white/5" />
        <select value={brand} onChange={e => setBrand(e.target.value)} className="p-3 rounded-md bg-neutral-900 border border-white/5">
          <option value="">All Brands</option>
          {brands.map((b: any) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} className="p-3 rounded-md bg-neutral-900 border border-white/5">
          <option value="">All Categories</option>
          {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p: any) => <ProductCard key={p.sku} product={p} />)}
      </div>

      {filtered.length === 0 && <div className="mt-8 text-shilaSilver">No results. Try widening your search or contact us on WhatsApp for help.</div>}
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const products = await getAllProducts()
    return { props: { products }, revalidate: 60 }
  } catch (err) {
    // keep build green and return empty list if backend unavailable
    // eslint-disable-next-line no-console
    console.error('getAllProducts error', err)
    return { props: { products: [] }, revalidate: 60 }
  }
}
