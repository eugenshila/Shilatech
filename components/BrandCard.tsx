import Link from 'next/link'

export default function BrandCard({brand}:{brand:string}){
  const assetMap:Record<string,string> = {
    'Jeep':'jeep',
    'Mercedes-Benz':'mercedes-benz',
    'Range Rover':'rangerover',
    'Volkswagen':'volkswagen',
    'Ford':'ford'
  }
  const asset = assetMap[brand] || brand.toLowerCase().replace(/\s+/g,'').replace(/-/g,'')

  return (
    <div className="card p-5 rounded-xl flex flex-col items-center text-center group transition-transform duration-200">
      <div className="h-20 w-full flex items-center justify-center mb-4 bg-black/55 rounded-lg border border-white/5 glossy-inset">
        <img src={`/brands/${asset}.svg`} alt={`${brand} spare parts`} className="h-14 max-w-[150px] brand-logo" />
      </div>
      <div className="font-black text-lg tracking-wide">{brand.toUpperCase()}</div>
      <p className="text-sm text-shilaSilver mt-2">Genuine &amp; quality parts</p>
      <Link href={{ pathname:'/products', query:{ brand } }}>
        <a className="mt-5 w-full px-4 py-2 border border-shilaGold/70 text-white rounded-md font-bold text-sm hover:bg-shilaGold hover:text-black">
          VIEW PARTS →
        </a>
      </Link>
    </div>
  )
}
