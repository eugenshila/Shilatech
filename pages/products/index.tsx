import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Header from '../../components/Header'
import ProductCard from '../../components/ProductCard'
import products from '../../data/products.json'

export default function Products(){
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    setQuery(typeof router.query.q === 'string' ? router.query.q : '')
    setBrand(typeof router.query.brand === 'string' ? router.query.brand : '')
    setCategory(typeof router.query.category === 'string' ? router.query.category : '')
  }, [router.isReady, router.query.q, router.query.brand, router.query.category])

  const brands = useMemo(() => Array.from(new Set(products.map((p:any)=>p.brand))).sort(), [])
  const categories = useMemo(() => Array.from(new Set(products.map((p:any)=>p.category))).sort(), [])

  const filtered = useMemo(() => products.filter((p:any) => {
    const q = query.trim().toLowerCase()
    const haystack = [p.name,p.part_number,p.oem_number,p.brand,p.category,p.description,p.vehicle_model]
      .filter(Boolean).join(' ').toLowerCase()
    return (!q || haystack.includes(q)) && (!brand || p.brand === brand) && (!category || p.category === category)
  }), [query, brand, category])

  const clearFilters = () => {
    setQuery('')
    setBrand('')
    setCategory('')
    router.replace('/products', undefined, { shallow: true })
  }

  return (
    <div className="min-h-screen bg-shilaBlack">
      <Head>
        <title>Spare Parts Catalogue | Shilatech Auto Spares</title>
        <meta name="description" content="Search Shilatech Auto Spares by part number, OEM number, brand, vehicle or category." />
      </Head>
      <Header />
      <main className="pt-[92px] lg:pt-[128px] pb-20">
        <section className="max-w-7xl mx-auto px-4 py-10">
          <p className="section-kicker">Premium parts catalogue</p>
          <h1 className="text-3xl md:text-5xl font-black mt-2">FIND THE RIGHT <span className="gold-text">SPARE PART</span></h1>
          <p className="text-shilaSilver mt-4 max-w-2xl">Search by part number, OEM number, vehicle, brand or part name. If you cannot find it, send us a WhatsApp enquiry.</p>

          <div className="premium-panel rounded-xl p-4 md:p-6 mt-8 grid grid-cols-1 lg:grid-cols-[1.5fr_.75fr_.75fr_auto] gap-3">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search part number, OEM, vehicle or keyword..." className="w-full p-3 rounded-md bg-black border border-white/10 focus:border-shilaGold outline-none" />
            <select value={brand} onChange={e=>setBrand(e.target.value)} className="p-3 rounded-md bg-black border border-white/10 focus:border-shilaGold outline-none">
              <option value="">All Brands</option>
              {brands.map((b:any)=><option key={b} value={b}>{b}</option>)}
            </select>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="p-3 rounded-md bg-black border border-white/10 focus:border-shilaGold outline-none">
              <option value="">All Categories</option>
              {categories.map((c:any)=><option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={clearFilters} className="px-5 py-3 gold-outline rounded-md font-bold">CLEAR</button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div className="text-shilaSilver"><span className="text-shilaGoldLight font-black">{filtered.length}</span> part{filtered.length===1?'':'s'} found</div>
            <a href="https://wa.me/254721802597?text=Hello%20Shilatech%20Auto%20Spares%2C%20I%20need%20help%20finding%20a%20spare%20part." className="text-shilaGoldLight font-bold hover:text-white">CAN'T FIND IT? WHATSAPP US →</a>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((p:any)=><ProductCard key={p.sku} product={p} />)}
            </div>
          ) : (
            <div className="premium-panel rounded-xl p-8 mt-7 text-center">
              <div className="text-2xl font-black">NO MATCHING PART FOUND</div>
              <p className="text-shilaSilver mt-3">Try a different part number, OEM number or vehicle name, or send us a photo on WhatsApp.</p>
              <a href="https://wa.me/254721802597?text=Hello%20Shilatech%20Auto%20Spares%2C%20please%20help%20me%20source%20a%20part." className="inline-block mt-5 px-6 py-3 btn-accent rounded-md">ASK ON WHATSAPP</a>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
