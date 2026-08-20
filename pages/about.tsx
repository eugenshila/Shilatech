import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'

export default function About(){
  return <div className="min-h-screen text-white">
    <Head><title>About Us | Shilatech Auto Spares</title></Head>
    <Header />
    <main className="pt-[92px] lg:pt-[128px] pb-16">
      <section className="max-w-6xl mx-auto px-4">
        <div className="page-glass rounded-2xl p-7 md:p-10">
          <p className="section-kicker">Who we are</p>
          <h1 className="text-3xl md:text-5xl font-black mt-3">ABOUT SHILATECH AUTO SPARES</h1>
          <p className="mt-6 text-shilaSilver text-lg leading-8 max-w-4xl">Shilatech Auto Spares supplies quality spare parts for Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford vehicles in Kenya. We focus on helping customers identify the correct part, source it quickly and receive dependable support before and after purchase.</p>
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {[
              ['QUALITY PARTS','We prioritise genuine and high-quality replacement parts for premium vehicles.'],
              ['EXPERT HELP','Share a part number, vehicle model or photo and we will help identify the correct item.'],
              ['NATIONWIDE SERVICE','We support customers in Nairobi and arrange delivery across Kenya.']
            ].map(([t,c])=><div key={t} className="card rounded-xl p-6"><h2 className="text-shilaGoldLight font-black">{t}</h2><p className="text-shilaSilver mt-3 leading-7">{c}</p></div>)}
          </div>
          <div className="mt-10 flex flex-wrap gap-4"><Link href="/products"><a className="btn-accent rounded-md px-6 py-3">SHOP SPARE PARTS</a></Link><Link href="/contact"><a className="gold-outline rounded-md px-6 py-3 font-bold">CONTACT US</a></Link></div>
        </div>
      </section>
    </main>
  </div>
}
