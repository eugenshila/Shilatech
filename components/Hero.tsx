export default function Hero(){
  return (
    <section className="relative bg-[url('/hero-bg.svg')] bg-cover bg-center h-96 flex items-center">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"></div>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold">QUALITY AUTO SPARES FOR THE VEHICLES YOU TRUST</h1>
          <p className="mt-4 text-shilaSilver">Quality spare parts for Jeep, Mercedes-Benz, Range Rover, Volkswagen and Ford vehicles. Find the right part for your vehicle and contact our team for availability and pricing.</p>

          <div className="mt-6 flex gap-3">
            <a href="/request" className="px-5 py-3 bg-shilaAccent text-white rounded-md font-semibold">FIND A SPARE PART</a>
            <a href="https://wa.me/254721802597?text=Hello%20Shilatech%20Auto%20Spares" className="px-5 py-3 border border-white/10 rounded-md">CONTACT US ON WHATSAPP</a>
          </div>

          <div className="mt-6 flex gap-4 items-center text-sm text-shilaSilver">
            <span className="font-medium">Brands:</span>
            <div className="flex gap-3">
              <img src="/brands/jeep.svg" alt="Jeep" className="h-8" />
              <img src="/brands/mercedes-benz.svg" alt="Mercedes-Benz" className="h-8" />
              <img src="/brands/rangerover.svg" alt="Range Rover" className="h-8" />
              <img src="/brands/volkswagen.svg" alt="Volkswagen" className="h-8" />
              <img src="/brands/ford.svg" alt="Ford" className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
