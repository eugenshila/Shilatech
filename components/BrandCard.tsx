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
    <div className="group min-h-[300px] rounded-xl border border-shilaGold/70 bg-[linear-gradient(180deg,rgba(18,18,18,.96),rgba(5,5,5,.98))] shadow-[0_18px_42px_rgba(0,0,0,.5)] px-5 py-5 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:border-shilaGoldLight">
      <div className="h-[94px] w-full flex items-center justify-center">
        <img src={`/brands/${asset}.svg`} alt={`${brand} spare parts`} className="h-[84px] max-w-[175px] w-auto object-contain brand-logo" />
      </div>
      <div className="h-px w-9 bg-shilaGold mt-1"></div>
      <h3 className="mt-4 text-[18px] font-extrabold text-white leading-tight">{brand.toUpperCase()}</h3>
      <p className="mt-5 min-h-[44px] text-[13px] leading-5 text-white/82 max-w-[190px]">{copyMap[brand]}</p>
      <Link href={{ pathname:'/products', query:{ brand } }}>
        <a className="mt-auto w-full max-w-[165px] rounded-md border border-shilaGold/90 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-shilaGold hover:text-black">
          VIEW PARTS <span className="ml-2 text-shilaGoldLight group-hover:text-black">→</span>
        </a>
      </Link>
    </div>
  )
}
