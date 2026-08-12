import Link from 'next/link'

export default function BrandCard({brand}:{brand:string}){
  const slug = brand.toLowerCase().replace(/\s+/g,'').replace(/-/g,'')
  return (
    <div className="card p-6 rounded-lg flex flex-col items-center text-center">
      <img src={`/brands/${slug}.svg`} alt={brand} className="h-16 mb-4" />
      <div className="font-semibold text-lg">{brand}</div>
      <p className="text-sm text-shilaSilver mt-2">Genuine & high-quality replacement parts</p>
      <Link href={`/brands/${slug}`}><a className="mt-4 px-4 py-2 bg-white text-black rounded-md">View Parts</a></Link>
    </div>
  )
}
