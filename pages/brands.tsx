import Head from 'next/head'
import Header from '../components/Header'
import BrandCard from '../components/BrandCard'

export default function Brands(){
  const brands=['Jeep','Mercedes-Benz','Range Rover','Volkswagen','Ford']
  return <div className="min-h-screen text-white">
    <Head><title>Vehicle Brands | Shilatech Auto Spares</title></Head>
    <Header />
    <main className="pt-[92px] lg:pt-[128px] pb-16">
      <section className="max-w-7xl mx-auto px-4">
        <div className="page-glass rounded-2xl p-7 md:p-10">
          <p className="section-kicker">Shop by vehicle</p>
          <h1 className="text-3xl md:text-5xl font-black mt-3">VEHICLE BRANDS</h1>
          <p className="mt-5 text-shilaSilver max-w-3xl leading-7">Choose your vehicle brand to view available spare parts. If you cannot find the exact item, send us the part number or vehicle details and we will help source it.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-10">{brands.map(b=><BrandCard key={b} brand={b}/>)}</div>
        </div>
      </section>
    </main>
  </div>
}
