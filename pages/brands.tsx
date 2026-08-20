import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import BrandCard from '../components/BrandCard'

export default function Brands(){
  const brands=['Jeep','Mercedes-Benz','Range Rover','Volkswagen','Ford']
  const benefits = [
    ['♢','100% GENUINE PARTS','Authentic parts you can trust'],
    ['▱','FAST DELIVERY','Nationwide delivery in Kenya'],
    ['▣','SECURE PAYMENT','Safe & secure transactions'],
    ['◉','EXPERT SUPPORT','We are here to help']
  ]

  return <div className="min-h-screen text-white bg-black">
    <Head><title>Vehicle Brands | Shilatech Auto Spares</title></Head>
    <Header />

    <main className="pt-[104px] lg:pt-[124px]">
      <section className="relative min-h-[650px] overflow-hidden border-b border-shilaGold/20">
        <div className="absolute inset-0 bg-[url('/wrangler-forest.png')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.90)_0%,rgba(0,0,0,.62)_30%,rgba(0,0,0,.12)_58%,rgba(0,0,0,.12)_100%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.02)_0%,rgba(0,0,0,.06)_55%,rgba(0,0,0,.34)_100%)]"></div>

        <div className="relative z-10 max-w-[1460px] mx-auto px-6 pt-12 lg:pt-14 pb-5">
          <div className="max-w-[520px]">
            <div className="flex items-center gap-3">
              <p className="text-shilaGoldLight uppercase font-bold tracking-[.08em] text-[16px]">Shop by vehicle</p>
              <span className="h-px w-9 bg-shilaGold"></span>
            </div>
            <h1 className="mt-4 text-[42px] sm:text-[54px] lg:text-[64px] font-black tracking-[-.035em] leading-[.95]">
              <span className="text-white">VEHICLE </span><span className="text-shilaGoldLight">BRANDS</span>
            </h1>
            <p className="mt-6 text-[16px] lg:text-[18px] leading-8 text-white/95 max-w-[500px]">
              Choose your vehicle brand to view available spare parts. If you cannot find the exact item, send us the part number or vehicle details and we will help source it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8 lg:mt-7">
            {brands.map(b=><BrandCard key={b} brand={b}/>) }
          </div>

          <div className="mt-4 rounded-xl border border-white/20 bg-black/82 backdrop-blur-lg shadow-[0_18px_45px_rgba(0,0,0,.42)]">
            <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {benefits.map(([icon,title,copy]) => (
                <div key={title} className="flex items-center gap-4 px-4 lg:border-r last:border-r-0 border-white/15 min-h-[58px]">
                  <div className="text-3xl text-shilaGoldLight shrink-0">{icon}</div>
                  <div>
                    <div className="text-[13px] font-extrabold text-shilaGoldLight tracking-wide">{title}</div>
                    <div className="text-[12px] text-white/80 mt-1 leading-5">{copy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer className="bg-[#050505] border-t border-white/10">
      <div className="max-w-[1460px] mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 text-[13px]">
        <div>
          <img src="/logo.svg" alt="Shilatech Auto Spares" className="h-14 w-auto logo-glow" />
          <p className="mt-4 text-white/75 leading-6 max-w-[260px]">Your trusted source for genuine and quality auto spare parts for premium vehicles in Kenya.</p>
          <div className="mt-5 flex gap-3 text-white/80 text-lg"><span>●</span><span>◎</span><span>◉</span></div>
        </div>

        <div>
          <div className="font-black mb-4 text-shilaGoldLight">QUICK LINKS</div>
          <div className="grid gap-2 text-white/78">
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
          <div className="grid gap-2 text-white/78">
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
          <div className="grid gap-2 text-white/78">
            <span>⌖ Nairobi, Kenya</span>
            <a href="tel:+254721802597">☎ 0721 802 597</a>
            <a href="https://wa.me/254721802597">◉ WhatsApp Us</a>
            <a href="mailto:sales@shilatech.co.ke">✉ sales@shilatech.co.ke</a>
            <span>◷ Mon - Sat: 8:00 AM - 6:00 PM</span>
          </div>
        </div>

        <div>
          <div className="font-black mb-4 text-shilaGoldLight">WE ACCEPT</div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white text-green-700 font-black rounded px-3 py-2">M-PESA</span>
            <span className="bg-white text-blue-700 font-black rounded px-3 py-2">VISA</span>
            <span className="bg-white text-orange-600 font-black rounded px-3 py-2">MC</span>
            <span className="bg-blue-600 text-white font-black rounded px-3 py-2">AMEX</span>
          </div>
        </div>
      </div>
      <div className="max-w-[1460px] mx-auto px-6 pb-5 text-center text-[12px] text-white/60">© {new Date().getFullYear()} Shilatech Auto Spares. All Rights Reserved.</div>
    </footer>
  </div>
}
