import Link from 'next/link'

export default function BrandCard({brand}:{brand:string}){
  const assetMap:Record<string,string> = {
    'Jeep':'jeep',
    'Mercedes-Benz':'mercedes-benz',
    'Range Rover':'rangerover',
    'Volkswagen':'volkswagen',
    'Ford':'ford'
  }
  const copyMap:Record<string,string> = {
    'Jeep':'Genuine & quality parts for Jeep vehicles.',
    'Mercedes-Benz':'Genuine & quality parts for Mercedes-Benz.',
    'Range Rover':'Genuine & quality parts for Range Rover.',
    'Volkswagen':'Genuine & quality parts for Volkswagen.',
    'Ford':'Genuine & quality parts for Ford vehicles.'
  }
  const asset = assetMap[brand] || brand.toLowerCase().replace(/\s+/g,'').replace(/-/g,'')

  return (
    <div className="group min-h-[282px] rounded-2xl border border-shilaGold/55 bg-black/82 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,.45)] px-5 py-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-shilaGoldLight hover:shadow-[0_28px_70px_rgba(0,0,0,.58)]">
      <div className="h-[96px] w-full flex items-center justify-center">
        <img src={`/brands/${asset}.svg`} alt={`${brand} spare parts`} className="h-[82px] max-w-[170px] w-auto object-contain brand-logo" />
      </div>

      <div className="mt-2 h-px w-9 bg-shilaGold"></div>
      <h3 className="mt-4 text-[18px] md:text-[19px] font-extrabold tracking-[-.01em] leading-tight text-white">
        {brand.toUpperCase()}
      </h3>
      <div className="mt-3 h-px w-8 bg-shilaGold/90"></div>

      <p className="mt-3 min-h-[42px] text-[13px] leading-5 text-white/80 max-w-[180px]">
        {copyMap[brand]}
      </p>

      <Link href={{ pathname:'/products', query:{ brand } }}>
        <a className="mt-auto w-full max-w-[165px] rounded-md border border-shilaGold/85 px-4 py-2.5 text-sm font-bold text-white hover:bg-shilaGold hover:text-black">
          VIEW PARTS <span className="ml-2 text-shilaGoldLight group-hover:text-black">→</span>
        </a>
      </Link>
    </div>
  )
}
