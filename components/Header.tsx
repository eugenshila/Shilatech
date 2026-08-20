import Link from 'next/link'

export default function Header(){
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl header-shadow border-b border-shilaGold/25">
      <div className="hidden lg:block border-b border-white/5 text-xs text-shilaSilver">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <span className="text-white">⌖ Nairobi, Kenya</span>
            <span>▱ Fast Nationwide Delivery</span>
            <span className="text-shilaGoldLight">◇ Genuine &amp; Quality Parts</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="tel:+254721802597" className="text-shilaGoldLight hover:text-white">☎ 0721 802 597</a>
            <a href="https://wa.me/254721802597" className="text-white hover:text-shilaGoldLight">◉ WhatsApp Us</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        <Link href="/">
          <a className="flex items-center gap-3 min-w-0">
            <img src="/logo.svg" alt="Shilatech Auto Spares" className="h-12 md:h-14 w-auto logo-glow" />
          </a>
        </Link>

        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs lg:text-sm font-semibold">
          <Link href="/"><a className="text-shilaGoldLight border-b-2 border-shilaGold pb-2">HOME</a></Link>
          <Link href="/about"><a className="text-shilaSilver hover:text-white">ABOUT US</a></Link>
          <Link href="/products"><a className="text-shilaSilver hover:text-white">SPARE PARTS</a></Link>
          <Link href="/brands"><a className="text-shilaSilver hover:text-white">VEHICLE BRANDS</a></Link>
          <Link href="/services"><a className="text-shilaSilver hover:text-white">SERVICES</a></Link>
          <Link href="/contact"><a className="text-shilaSilver hover:text-white">CONTACT US</a></Link>
        </nav>

        <div className="flex items-center gap-2">
          <a href="https://wa.me/254721802597" className="hidden lg:inline-flex px-4 py-2 gold-outline rounded-md text-shilaGoldLight font-semibold hover:bg-shilaGold hover:text-black">WhatsApp</a>
          <Link href="/request"><a className="px-4 py-2 btn-accent rounded-md text-xs sm:text-sm whitespace-nowrap">FIND A PART</a></Link>
        </div>
      </div>
    </header>
  )
}
