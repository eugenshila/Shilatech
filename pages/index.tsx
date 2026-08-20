import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Hero from '../components/Hero'
import BrandCard from '../components/BrandCard'
import ProductCard from '../components/ProductCard'
import products from '../data/products.json'

export default function Home() {
  const featured = products.filter((p:any) => p.featured).slice(0,6)
  const brands = ['Jeep','Mercedes-Benz','Range Rover','Volkswagen','Ford']

  const benefits = [
    ['◇','100% GENUINE PARTS','Authentic parts you can trust'],
    ['▱','FAST DELIVERY','Nationwide delivery in Kenya'],
    ['▣','SECURE SERVICE','Safe & reliable transactions'],
    ['◉','EXPERT SUPPORT','We are here to help']
  ]

  return (
    <div className="min-h-screen bg-transparent">
      <Head>
        <title>Shilatech Auto Spares — Premium Auto Spares in Kenya</title>
        <meta name="description" content="Premium spare parts for Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford. Search by part number, vehicle or keyword and contact Shilatech Auto Spares in Nairobi." />
      </Head>

      <Header />
      <main className="pt-[76px] lg:pt-[112px]">
        <Hero />

        <section className="max-w-7xl mx-auto px-4 pt-32 md:pt-36 pb-6">
          <div className="page-glass rounded-2xl px-4 md:px-7 py-8">
            <div className="flex items-center justify-center gap-4 mb-7">
              <span className="w-10 h-px bg-shilaGold"></span>
              <h2 className="text-xl md:text-2xl font-black tracking-wide text-center">SHOP BY VEHICLE BRAND</h2>
              <span className="w-10 h-px bg-shilaGold"></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {brands.map(b => <BrandCard key={b} brand={b} />)}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-3">
          <div className="benefit-strip rounded-xl border border-shilaGold/25">
            <div className="px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map(([icon,title,copy]) => (
                <div key={title} className="flex items-center gap-4 px-4 lg:border-r last:border-r-0 border-white/10">
                  <div className="text-3xl text-shilaGoldLight">{icon}</div>
                  <div>
                    <div className="text-sm font-black text-shilaGoldLight">{title}</div>
                    <div className="text-xs text-shilaSilver mt-1">{copy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="page-glass rounded-2xl px-4 md:px-7 py-8">
            <div className="flex items-end justify-between gap-4 mb-7">
              <div>
                <p className="section-kicker mb-2">Popular right now</p>
                <h2 className="text-2xl md:text-3xl font-black">FEATURED SPARE PARTS</h2>
                <div className="mt-3 h-0.5 w-24 bg-shilaGold"></div>
              </div>
              <Link href="/products"><a className="text-sm font-bold text-shilaGoldLight hover:text-white">VIEW ALL PARTS →</a></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {featured.map((p:any) => <ProductCard key={p.sku} product={p} />)}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-12 pt-3">
          <div className="premium-panel newsletter-panel rounded-xl px-5 md:px-8 py-6 flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl text-shilaGoldLight">✉</div>
              <div>
                <div className="font-black text-xl text-shilaGoldLight">STAY UPDATED</div>
                <p className="text-sm text-shilaSilver mt-1">Get updates on new parts, stock arrivals and special offers.</p>
              </div>
            </div>
            <form action="/contact" className="flex w-full lg:max-w-xl">
              <input name="email" type="email" placeholder="Enter your email address" className="flex-1 min-w-0 px-4 py-3 rounded-l-md" />
              <button className="btn-accent px-6 rounded-r-md">SUBSCRIBE</button>
            </form>
          </div>
        </section>
      </main>

      <footer className="footer-gloss border-t border-shilaGold/25">
        <div className="max-w-7xl mx-auto px-4 py-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-9 text-sm">
          <div>
            <img src="/logo.svg" alt="Shilatech Auto Spares" className="h-16 w-auto logo-glow" />
            <p className="mt-4 text-shilaSilver leading-6">Your trusted source for genuine and quality auto spare parts for premium vehicles in Kenya.</p>
            <div className="mt-5 flex gap-3 text-shilaGoldLight"><span>●</span><span>◎</span><span>◉</span></div>
          </div>
          <div>
            <div className="font-black mb-4">QUICK LINKS</div>
            <div className="grid gap-2 text-shilaSilver">
              <Link href="/">Home</Link><Link href="/about">About Us</Link><Link href="/products">Spare Parts</Link><Link href="/brands">Vehicle Brands</Link><Link href="/services">Services</Link><Link href="/contact">Contact Us</Link>
            </div>
          </div>
          <div>
            <div className="font-black mb-4">CUSTOMER SERVICE</div>
            <div className="grid gap-2 text-shilaSilver">
              <Link href="/delivery"><a className="hover:text-shilaGoldLight">Delivery Information</a></Link>
              <Link href="/returns"><a className="hover:text-shilaGoldLight">Returns &amp; Warranty</a></Link>
              <Link href="/payments"><a className="hover:text-shilaGoldLight">Payment Methods</a></Link>
              <Link href="/terms"><a className="hover:text-shilaGoldLight">Terms &amp; Conditions</a></Link>
              <Link href="/privacy"><a className="hover:text-shilaGoldLight">Privacy Policy</a></Link>
              <Link href="/faq"><a className="hover:text-shilaGoldLight">FAQs</a></Link>
            </div>
          </div>
          <div>
            <div className="font-black mb-4">CONTACT US</div>
            <div className="grid gap-2 text-shilaSilver">
              <span>⌖ Nairobi, Kenya</span>
              <a href="tel:+254721802597">☎ 0721 802 597</a>
              <a href="https://wa.me/254721802597" className="text-shilaGoldLight">◉ WhatsApp Us</a>
              <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
            </div>
            <Link href="/request"><a className="inline-block mt-5 px-5 py-3 btn-accent rounded-md">FIND A SPARE PART</a></Link>
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
