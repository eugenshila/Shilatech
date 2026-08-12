import Link from 'next/link'

export default function ProductCard({product}:{product:any}){
  return (
    <div className="card rounded-lg overflow-hidden">
      <div className="h-48 bg-neutral-900 flex items-center justify-center">
        <img src={product.image} alt={product.name} className="object-contain h-full" />
      </div>
      <div className="p-4">
        <div className="font-semibold">{product.name}</div>
        <div className="text-xs text-shilaSilver">{product.brand} • {product.compatibility.join(' / ')}</div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-lg font-bold">{product.price? `KSh ${product.price}` : 'Request Price'}</div>
          <div className="flex gap-2">
            <Link href={`/products/${product.slug}`}><a className="px-3 py-1 border border-white/10 rounded-md">View Details</a></Link>
            <a href={`https://wa.me/254721802597?text=Hello%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}`} className="px-3 py-1 btn-accent rounded-md">WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  )
}
