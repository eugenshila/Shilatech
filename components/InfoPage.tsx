import Head from 'next/head'
import Link from 'next/link'
import Header from './Header'

export default function InfoPage({title,kicker,intro,sections}:{title:string,kicker:string,intro:string,sections:{title:string,body:string}[]}){
  return <div className="min-h-screen text-white">
    <Head><title>{title} | Shilatech Auto Spares</title></Head>
    <Header />
    <main className="pt-[92px] lg:pt-[128px] pb-16">
      <section className="max-w-6xl mx-auto px-4">
        <div className="page-glass rounded-2xl p-7 md:p-10">
          <p className="section-kicker">{kicker}</p>
          <h1 className="text-3xl md:text-5xl font-black mt-3">{title.toUpperCase()}</h1>
          <p className="mt-6 text-shilaSilver text-lg leading-8 max-w-4xl">{intro}</p>
          <div className="grid md:grid-cols-2 gap-5 mt-10">
            {sections.map((s)=><div key={s.title} className="card rounded-xl p-6"><h2 className="text-shilaGoldLight font-black">{s.title}</h2><p className="text-shilaSilver mt-3 leading-7">{s.body}</p></div>)}
          </div>
          <div className="mt-10 flex flex-wrap gap-4"><Link href="/products"><a className="btn-accent rounded-md px-6 py-3">SHOP SPARE PARTS</a></Link><Link href="/contact"><a className="gold-outline rounded-md px-6 py-3 font-bold">CONTACT US</a></Link></div>
        </div>
      </section>
    </main>
  </div>
}
