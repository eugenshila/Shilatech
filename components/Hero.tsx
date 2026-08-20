import Link from 'next/link'

export default function Hero(){
  return (
    <section className="hero-stage border-b border-shilaGold/25">
      <div className="max-w-7xl mx-auto px-4 pt-16 md:pt-20 pb-36 md:pb-40 min-h-[620px] md:min-h-[690px] flex items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-shilaGold"></span>
            <span className="section-kicker">Quality you can trust</span>
            <span className="w-8 h-px bg-shilaGold"></span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.03] tracking-tight text-white">
            PREMIUM AUTO SPARES
            <br />FOR <span className="gold-text">PREMIUM VEHICLES</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-shilaSilver leading-8 max-w-xl">
            Specialists in genuine and high-quality spare parts for Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford. Quality parts. Expert service. Every time.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/products"><a className="px-7 py-3.5 btn-accent rounded-md">▣ SHOP SPARE PARTS</a></Link>
            <a href="https://wa.me/254721802597?text=Hello%20Shilatech%20Auto%20Spares" className="px-7 py-3.5 gold-outline rounded-md font-bold text-white hover:bg-shilaGold hover:text-black">◉ WHATSAPP US</a>
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-[-92px] z-20 px-4">
        <div className="max-w-5xl mx-auto premium-panel rounded-2xl px-5 md:px-8 py-5 md:py-6 glossy-search">
          <div className="text-center font-black text-shilaGoldLight tracking-wide text-lg">FIND THE RIGHT PART</div>
          <div className="mt-4 mx-auto max-w-2xl grid grid-cols-3 text-xs font-bold">
            <div className="py-3 text-center text-shilaGoldLight border-b-2 border-shilaGold bg-white/[.02]">BY PART NUMBER</div>
            <div className="py-3 text-center text-shilaSilver border-b border-white/10">BY VEHICLE</div>
            <div className="py-3 text-center text-shilaSilver border-b border-white/10">BY KEYWORD</div>
          </div>

          <form action="/products" method="get" className="mt-4 flex max-w-4xl mx-auto">
            <input name="q" aria-label="Search spare parts" placeholder="Enter part number (e.g. A 271 094 02 04)" className="min-w-0 flex-1 bg-white text-black px-5 py-4 rounded-l-md outline-none" />
            <button type="submit" className="px-6 md:px-8 bg-shilaGold text-black font-black rounded-r-md hover:bg-shilaGoldLight">⌕</button>
          </form>

          <div className="mt-4 text-center text-sm text-shilaSilver">
            Need help? Call or WhatsApp us <a href="tel:+254721802597" className="text-shilaGoldLight font-bold">0721 802 597</a>
          </div>
        </div>
      </div>
    </section>
  )
}
