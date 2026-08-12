import Head from 'next/head'
import Header from '../components/Header'
import Hero from '../components/Hero'
import BrandCard from '../components/BrandCard'
import ProductCard from '../components/ProductCard'
import products from '../data/products.json'

export default function Home() {
  const featured = products.filter(p => p.featured).slice(0,6)
  const brands = ['Jeep','Mercedes-Benz','Range Rover','Volkswagen','Ford']

  return (
    <div>
      <Head>
        <title>Shilatech Auto Spares — Quality Auto Spares for Vehicles You Trust</title>
        <meta name="description" content="Quality spare parts for Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford vehicles. Find OEM and compatible parts. Contact via WhatsApp." />
      </Head>

      <Header />
      <main className="pt-24">
        <Hero />

        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-semibold mb-6">SHOP BY VEHICLE BRAND</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {brands.map(b => <BrandCard key={b} brand={b} />)}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-semibold mb-6">FEATURED SPARE PARTS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(p => <ProductCard key={p.sku} product={p} />)}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-semibold mb-4">WHY CHOOSE SHILATECH AUTO SPARES?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 rounded-lg">
              <h3 className="font-semibold text-xl">Quality Parts</h3>
              <p className="mt-2 text-sm text-shilaSilver">High-quality spare parts selected for reliability and performance.</p>
            </div>
            <div className="card p-6 rounded-lg">
              <h3 className="font-semibold text-xl">Vehicle Expertise</h3>
              <p className="mt-2 text-sm text-shilaSilver">Specialized knowledge of Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford vehicles.</p>
            </div>
            <div className="card p-6 rounded-lg">
              <h3 className="font-semibold text-xl">Fast Enquiries</h3>
              <p className="mt-2 text-sm text-shilaSilver">Contact us quickly through WhatsApp, phone or the website.</p>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-shilaCharcoal mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-sm text-shilaSilver">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="font-bold text-lg">SHILATECH AUTO SPARES</div>
              <div className="mt-1">Quality Auto Spares for Jeep | Mercedes-Benz | Range Rover | Volkswagen | Ford</div>
            </div>
            <div className="flex gap-4">
              <a href="/">Home</a>
              <a href="/about">About</a>
              <a href="/products">Spare Parts</a>
              <a href="/contact">Contact</a>
            </div>
          </div>

          <div className="mt-6 text-xs text-shilaSilver">© {new Date().getFullYear()} Shilatech Auto Spares. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
