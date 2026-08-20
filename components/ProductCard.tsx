import Link from 'next/link'

export default function ProductCard({product}:{product:any}){
  return (
    <div className="card rounded-xl overflow-hidden group transition-transform duration-200 hover:-translate-y-1">
      <div className="h-52 bg-white flex items-center justify-center overflow-hidden">
        <img src={product.image} alt={product.name} className="object-contain h-full w-full p-4 transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <div className="font-bold text-lg">{product.name}</div>
        <div className="text-xs text-shilaSilver mt-1">{product.brand} • {product.compatibility.join(' / ')}</div>
        <div className="mt-4 text-xl font-black text-shilaGoldLight">
          {product.price ? `KSh ${Number(product.price).toLocaleString()}` : 'REQUEST PRICE'}
        </div>
        <div className="mt-4 flex gap-2">
          <Link href={`/products/${product.slug}`}>
            <a className="flex-1 text-center px-3 py-2 border border-shilaGold/70 rounded-md font-bold text-sm hover:bg-shilaGold hover:text-black">VIEW DETAILS</a>
          </Link>
          <a href={`https://wa.me/254721802597?text=Hello%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}`} className="px-4 py-2 btn-accent rounded-md" aria-label={`WhatsApp about ${product.name}`}>◫</a>
        </div>
      </div>
    </div>
  )
}
