import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Hero from '../components/Hero'
import BrandCard from '../components/BrandCard'
import ProductCard from '../components/ProductCard'
import products from '../data/products.json'

export default function Home() {
  const featured = products.filter(p => p.featured).slice(0,5)
  const brands = ['Jeep','Mercedes-Benz','Range Rover','Volkswagen','Ford']

  const benefits = [
    ['◇','100% GENUINE PARTS','Authentic parts you can trust'],
    ['▱','FAST DELIVERY','Nationwide delivery in Kenya'],
    ['▣','SECURE PAYMENT','Safe & secure transactions'],
    ['◉','EXPERT SUPPORT','We are here to help']
  ]

  return (
    <div className="min-h-screen bg-shilaBlack">
      <Head>
        <title>Shilatech Auto Spares — Premium Auto Spares in Kenya</title>
        <meta name="description" content="Premium spare parts for Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford. Search by part number, vehicle or keyword and contact Shilatech Auto Spares in Nairobi." />
      </Head>

      <Header />
      <main className="pt-[76px] lg:pt-[112px]">
        <Hero />

        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center gap-4 mb-7">
            <span className="w-10 h-px bg-shilaGold"></span>
            <h2 className="text-2xl md:text-3xl font-black tracking-wide text-center">SHOP BY VEHICLE BRAND</h2>
            <span className="w-10 h-px bg-shilaGold"></span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {brands.map(b => <BrandCard key={b} brand={b} />)}
          </div>
        </section>

        <section className="border-y border-shilaGold/20 bg-black/65">
          <div className="max-w-7xl mx-auto px-4 py-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map(([icon,title,copy]) => (
              <div key={title} className="flex items-center gap-4 px-4 lg:border-r last:border-r-0 border-shilaGold/25">
                <div className="text-3xl text-shilaGoldLight">{icon}</div>
                <div>
                  <div className="text-sm font-black text-shilaGoldLight">{title}</div>
                  <div className="text-xs text-shilaSilver mt-1">{copy}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="section-kicker mb-2">Popular right now</p>
              <h2 className="text-2xl md:text-3xl font-black">FEATURED SPARE PARTS</h2>
              <div className="mt-3 h-0.5 w-24 bg-shilaGold"></div>
            </div>
            <Link href="/products"><a className="text-sm font-bold text-shilaGoldLight hover:text-white">VIEW ALL PARTS →</a></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {featured.map(p => <ProductCard key={p.sku} product={p} />)}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-14">
          <div className="premium-panel rounded-xl px-5 py-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
            <div className="text-center lg:text-left">
              <div className="text-3xl font-black text-shilaGoldLight">1000+</div>
              <div className="text-xs font-bold tracking-wide">HAPPY CUSTOMERS</div>
            </div>
            {[
              ['◇','Quality Assured','Only premium quality parts'],
              ['♜','Wide Range','Thousands of parts available'],
              ['◈','Best Prices','Competitive & fair pricing'],
              ['✓','Expert Advice','Get the right part, first time']
            ].map(([icon,title,copy]) => (
              <div key={title} className="flex gap-3">
                <div className="text-2xl text-shilaGoldLight">{icon}</div>
                <div><div className="font-bold">{title}</div><div className="text-xs text-shilaSilver mt-1">{copy}</div></div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-black border-t border-shilaGold/20">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-sm">
          <div>
            <div className="font-black text-xl">SHILATECH <span className="text-shilaGoldLight">AUTO SPARES</span></div>
            <p className="mt-4 text-shilaSilver leading-6">Your trusted source for quality auto spare parts for premium vehicles in Kenya.</p>
          </div>
          <div>
            <div className="font-black mb-4">QUICK LINKS</div>
            <div className="grid gap-2 text-shilaSilver">
              <Link href="/about">About Us</Link><Link href="/products">Spare Parts</Link><Link href="/brands">Vehicle Brands</Link><Link href="/services">Services</Link><Link href="/contact">Contact Us</Link>
            </div>
          </div>
          <div>
            <div className="font-black mb-4">CONTACT US</div>
            <div className="grid gap-2 text-shilaSilver">
              <span>⌖ Nairobi, Kenya</span>
              <a href="tel:+254721802597">☎ 0721 802 597</a>
              <a href="https://wa.me/254721802597">WhatsApp Us</a>
              <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
            </div>
          </div>
          <div>
            <div className="font-black mb-4">NEED A SPECIFIC PART?</div>
            <p className="text-shilaSilver mb-4">Send us the part number, vehicle model or photo and our team will help you source it.</p>
            <Link href="/request"><a className="inline-block px-5 py-3 btn-accent rounded-md">FIND A SPARE PART</a></Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-5 border-t border-white/10 text-xs text-shilaSilver flex flex-col sm:flex-row gap-3 justify-between">
          <span>© {new Date().getFullYear()} Shilatech Auto Spares. All Rights Reserved.</span>
          <span className="text-shilaGoldLight">Quality Parts • Trusted Performance</span>
        </div>
      </footer>
    </div>
  )
}
