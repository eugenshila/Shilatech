import Link from 'next/link'

export default function Hero(){
  return (
    <section className="hero-stage min-h-[610px] md:min-h-[660px] flex items-center border-b border-shilaGold/20">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 w-full grid lg:grid-cols-[1.05fr_.95fr] gap-10 items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-shilaGold"></span>
            <span className="section-kicker">Quality you can trust</span>
            <span className="w-8 h-px bg-shilaGold"></span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.04] tracking-tight">
            PREMIUM AUTO SPARES
            <br />FOR <span className="gold-text">PREMIUM VEHICLES</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-shilaSilver leading-8 max-w-xl">
            Specialists in quality spare parts for Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford. Quality parts. Expert service. Every time.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/products"><a className="px-6 py-3 btn-accent rounded-md">SHOP SPARE PARTS</a></Link>
            <a href="https://wa.me/254721802597?text=Hello%20Shilatech%20Auto%20Spares" className="px-6 py-3 gold-outline rounded-md font-bold hover:bg-shilaGold hover:text-black">WHATSAPP US</a>
          </div>
        </div>

        <div className="premium-panel rounded-xl p-5 md:p-7 lg:mt-24">
          <div className="text-center font-black text-shilaGoldLight tracking-wide">FIND THE RIGHT PART</div>
          <div className="mt-5 grid grid-cols-3 text-xs font-bold border-b border-white/10">
            <div className="py-3 text-center text-shilaGoldLight border-b-2 border-shilaGold">BY PART NUMBER</div>
            <div className="py-3 text-center text-shilaSilver">BY VEHICLE</div>
            <div className="py-3 text-center text-shilaSilver">BY KEYWORD</div>
          </div>

          <form action="/request" method="get" className="mt-4 flex">
            <input name="part" aria-label="Part number" placeholder="Enter part number (e.g. A 271 094 02 04)" className="min-w-0 flex-1 bg-white text-black px-4 py-3 rounded-l-md outline-none" />
            <button type="submit" className="px-5 bg-shilaGold text-black font-black rounded-r-md hover:bg-shilaGoldLight">⌕</button>
          </form>

          <div className="mt-4 text-sm text-shilaSilver">
            Need help? Call or WhatsApp us <a href="tel:+254721802597" className="text-shilaGoldLight font-bold">0721 802 597</a>
          </div>
        </div>
      </div>
    </section>
  )
}
