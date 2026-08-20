import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'

export default function Services(){
  const services=[
    ['PART IDENTIFICATION','Send us a part number, vehicle model, VIN details or a clear photo and we will help identify the correct spare part.'],
    ['PART SOURCING','We help source quality parts for Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford vehicles.'],
    ['WHATSAPP ASSISTANCE','Get quick help with availability, pricing and compatibility through WhatsApp.'],
    ['NATIONWIDE DELIVERY','We support delivery of available parts to customers across Kenya.'],
    ['PRODUCT ADVICE','We help you compare available options so you can choose the right part for your vehicle.'],
    ['ORDER SUPPORT','Our team can assist from enquiry through confirmation and collection or delivery.']
  ]
  return <div className="min-h-screen text-white">
    <Head><title>Services | Shilatech Auto Spares</title></Head>
    <Header />
    <main className="pt-[92px] lg:pt-[128px] pb-16">
      <section className="max-w-7xl mx-auto px-4">
        <div className="page-glass rounded-2xl p-7 md:p-10">
          <p className="section-kicker">How we help</p>
          <h1 className="text-3xl md:text-5xl font-black mt-3">OUR SERVICES</h1>
          <p className="mt-5 text-shilaSilver max-w-3xl leading-7">Shilatech combines spare-parts supply with practical support to help customers find the correct item faster and with greater confidence.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">{services.map(([t,c])=><div key={t} className="card rounded-xl p-6"><h2 className="text-shilaGoldLight font-black">{t}</h2><p className="text-shilaSilver mt-3 leading-7">{c}</p></div>)}</div>
          <div className="mt-10 flex flex-wrap gap-4"><Link href="/request"><a className="btn-accent rounded-md px-6 py-3">FIND A SPARE PART</a></Link><a href="https://wa.me/254721802597" className="gold-outline rounded-md px-6 py-3 font-bold">WHATSAPP US</a></div>
        </div>
      </section>
    </main>
  </div>
}
