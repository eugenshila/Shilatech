import Link from 'next/link'

export default function BrandCard({brand}:{brand:string}){
  const slug = brand.toLowerCase().replace(/\s+/g,'').replace(/-/g,'')
  return (
    <div className="card p-6 rounded-xl flex flex-col items-center text-center group transition-transform duration-200 hover:-translate-y-1">
      <div className="h-20 w-full flex items-center justify-center mb-4 bg-black/40 rounded-lg border border-white/5">
        <img src={`/brands/${slug}.svg`} alt={brand} className="h-14 max-w-[150px] brand-logo" />
      </div>
      <div className="font-black text-lg tracking-wide">{brand.toUpperCase()}</div>
      <p className="text-sm text-shilaSilver mt-2">Genuine &amp; quality replacement parts</p>
      <Link href={`/brands/${slug}`}>
        <a className="mt-5 w-full px-4 py-2 border border-shilaGold/70 text-white rounded-md font-bold text-sm hover:bg-shilaGold hover:text-black">
          VIEW PARTS →
        </a>
      </Link>
    </div>
  )
}
