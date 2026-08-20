import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import BrandCard from '../components/BrandCard'

export default function Brands(){
  const brands=['Jeep','Mercedes-Benz','Range Rover','Volkswagen','Ford']
  const benefits = [
    ['◇','100% GENUINE PARTS','Authentic parts you can trust'],
    ['▱','FAST DELIVERY','Nationwide delivery in Kenya'],
    ['▣','SECURE PAYMENT','Safe & secure transactions'],
    ['◉','EXPERT SUPPORT','We are here to help']
  ]

  return <div className="min-h-screen text-white">
    <Head><title>Vehicle Brands | Shilatech Auto Spares</title></Head>
    <Header />

    <main className="pt-[92px] lg:pt-[128px]">
      <section className="relative overflow-hidden border-b border-shilaGold/20">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.92)_0%,rgba(0,0,0,.75)_26%,rgba(0,0,0,.24)_53%,rgba(0,0,0,.08)_100%)] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-14 md:pt-20 pb-8 md:pb-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <p className="section-kicker">Shop by vehicle</p>
              <span className="hidden sm:block h-px w-8 bg-shilaGold"></span>
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl font-black tracking-[-.035em] leading-[.95]">
              VEHICLE <span className="text-shilaGoldLight">BRANDS</span>
            </h1>
            <p className="mt-6 text-[16px] md:text-[18px] leading-8 text-white/88 max-w-lg">
              Choose your vehicle brand to view available spare parts. If you cannot find the exact item, send us the part number or vehicle details and we will help source it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-12 md:mt-14">
            {brands.map(b=><BrandCard key={b} brand={b}/>) }
          </div>

          <div className="mt-5 rounded-2xl border border-white/12 bg-black/72 backdrop-blur-xl shadow-[0_20px_55px_rgba(0,0,0,.38)]">
            <div className="px-4 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map(([icon,title,copy]) => (
                <div key={title} className="flex items-center gap-4 px-3 lg:border-r last:border-r-0 border-white/10 min-h-[64px]">
                  <div className="text-3xl text-shilaGoldLight shrink-0">{icon}</div>
                  <div>
                    <div className="text-sm font-extrabold text-shilaGoldLight tracking-wide">{title}</div>
                    <div className="text-xs text-white/75 mt-1 leading-5">{copy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer className="footer-gloss border-t border-shilaGold/25">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-9 text-sm">
        <div>
          <img src="/logo.svg" alt="Shilatech Auto Spares" className="h-16 w-auto logo-glow" />
          <p className="mt-4 text-shilaSilver leading-6">Your trusted source for genuine and quality auto spare parts for premium vehicles in Kenya.</p>
          <div className="mt-5 flex gap-3 text-shilaGoldLight"><span>●</span><span>◎</span><span>◉</span></div>
        </div>

        <div>
          <div className="font-black mb-4 text-shilaGoldLight">QUICK LINKS</div>
          <div className="grid gap-2 text-shilaSilver">
            <Link href="/"><a>Home</a></Link>
            <Link href="/about"><a>About Us</a></Link>
            <Link href="/products"><a>Spare Parts</a></Link>
            <Link href="/brands"><a>Vehicle Brands</a></Link>
            <Link href="/services"><a>Services</a></Link>
            <Link href="/contact"><a>Contact Us</a></Link>
          </div>
        </div>

        <div>
          <div className="font-black mb-4 text-shilaGoldLight">CUSTOMER SERVICE</div>
          <div className="grid gap-2 text-shilaSilver">
            <Link href="/delivery"><a>Delivery Information</a></Link>
            <Link href="/returns"><a>Returns &amp; Warranty</a></Link>
            <Link href="/payments"><a>Payment Methods</a></Link>
            <Link href="/terms"><a>Terms &amp; Conditions</a></Link>
            <Link href="/privacy"><a>Privacy Policy</a></Link>
            <Link href="/faqs"><a>FAQs</a></Link>
          </div>
        </div>

        <div>
          <div className="font-black mb-4 text-shilaGoldLight">CONTACT US</div>
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
}
