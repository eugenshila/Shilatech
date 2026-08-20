import Head from 'next/head'
import Header from '../components/Header'

export default function Contact(){
  return <div className="min-h-screen text-white">
    <Head><title>Contact Us | Shilatech Auto Spares</title></Head>
    <Header />
    <main className="pt-[92px] lg:pt-[128px] pb-16">
      <section className="max-w-6xl mx-auto px-4">
        <div className="page-glass rounded-2xl p-7 md:p-10">
          <p className="section-kicker">Get in touch</p>
          <h1 className="text-3xl md:text-5xl font-black mt-3">CONTACT SHILATECH</h1>
          <div className="grid lg:grid-cols-2 gap-8 mt-10">
            <div className="card rounded-xl p-6">
              <h2 className="text-xl font-black text-shilaGoldLight">CONTACT DETAILS</h2>
              <div className="mt-5 grid gap-4 text-shilaSilver">
                <span>⌖ Nairobi, Kenya</span>
                <a href="tel:+254721802597">☎ 0721 802 597</a>
                <a className="text-shilaGoldLight font-bold" href="https://wa.me/254721802597">◉ WhatsApp Us</a>
                <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
              </div>
            </div>
            <div className="card rounded-xl p-6">
              <h2 className="text-xl font-black text-shilaGoldLight">SEND AN ENQUIRY</h2>
              <form action="/request" className="grid gap-4 mt-5">
                <input name="name" placeholder="Your name" className="px-4 py-3 rounded-md" />
                <input name="phone" placeholder="Phone number" className="px-4 py-3 rounded-md" />
                <input name="q" placeholder="Part number, vehicle or item needed" className="px-4 py-3 rounded-md" />
                <button className="btn-accent rounded-md px-6 py-3">CONTINUE TO PART REQUEST</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
}
