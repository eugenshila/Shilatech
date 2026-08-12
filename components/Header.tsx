import Link from 'next/link'

export default function Header(){
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur header-shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <a className="flex items-center gap-3">
              <img src="/logo.svg" alt="Shilatech Auto Spares" className="h-10" />
              <div className="hidden sm:block">
                <div className="font-bold text-lg">SHILATECH</div>
                <div className="text-xs text-shilaSilver -mt-1">AUTO SPARES</div>
              </div>
            </a>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-shilaSilver">
          <Link href="/">Home</Link>
          <Link href="/about">About Us</Link>
          <Link href="/products">Spare Parts</Link>
          <Link href="/brands">Vehicle Brands</Link>
          <Link href="/services">Services</Link>
          <Link href="/contact">Contact Us</Link>
          <a href="tel:+254721802597" className="px-3 py-2 border border-transparent rounded-md hover:bg-white/5">Call</a>
          <a href="https://wa.me/254721802597" className="px-3 py-2 btn-accent rounded-md">WhatsApp</a>
          <Link href="/request"><a className="ml-4 px-4 py-2 bg-white text-black rounded-md font-semibold">FIND A SPARE PART</a></Link>
        </nav>

        <div className="md:hidden">
          <a href="https://wa.me/254721802597" className="px-3 py-2 btn-accent rounded-md">WhatsApp</a>
        </div>
      </div>
    </header>
  )
}
