import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Header(){
  const router = useRouter()
  const item = (href:string,label:string) => {
    const active = href === '/' ? router.pathname === '/' : router.pathname.startsWith(href)
    return <Link href={href}><a className={`pb-2 border-b-2 ${active ? 'text-shilaGoldLight border-shilaGold' : 'text-white/80 border-transparent hover:text-white'}`}>{label}</a></Link>
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-b border-shilaGold/20 shadow-[0_14px_42px_rgba(0,0,0,.55)]">
      <div className="hidden lg:block border-b border-white/10 text-[12px]">
        <div className="max-w-[1460px] mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-8 text-white/85">
            <span>⌖ Nairobi, Kenya</span>
            <span>▰ Fast Nationwide Delivery</span>
            <span>◇ Genuine &amp; Quality Parts</span>
          </div>
          <div className="flex items-center gap-7">
            <a href="tel:+254721802597" className="text-shilaGoldLight hover:text-white">☎ 0721 802 597</a>
            <a href="https://wa.me/254721802597" className="text-white hover:text-shilaGoldLight">◉ WhatsApp Us</a>
          </div>
        </div>
      </div>

      <div className="max-w-[1460px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
        <Link href="/"><a className="shrink-0"><img src="/logo.svg" alt="Shilatech Auto Spares" className="h-14 lg:h-16 w-auto logo-glow" /></a></Link>

        <nav className="hidden md:flex items-center gap-7 xl:gap-9 text-[13px] xl:text-[14px] font-semibold whitespace-nowrap">
          {item('/','HOME')}
          {item('/about','ABOUT US')}
          {item('/products','SPARE PARTS')}
          {item('/brands','VEHICLE BRANDS')}
          {item('/services','SERVICES')}
          {item('/contact','CONTACT US')}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <a href="https://wa.me/254721802597" className="hidden lg:inline-flex items-center gap-2 px-5 py-3 border border-shilaGold/80 rounded-md text-white font-semibold hover:bg-white/5">◉ WhatsApp</a>
          <Link href="/request"><a className="px-5 py-3 btn-accent rounded-md text-sm whitespace-nowrap">FIND A PART</a></Link>
        </div>
      </div>
    </header>
  )
}
