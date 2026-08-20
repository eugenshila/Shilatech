import Link from 'next/link'

export default function ProductCard({product}:{product:any}){
  const compatibility = Array.isArray(product.compatibility) ? product.compatibility.join(' / ') : product.compatibility || ''
  return (
    <div className="card rounded-xl overflow-hidden group transition-transform duration-200">
      <div className="h-48 bg-gradient-to-b from-white to-neutral-200 flex items-center justify-center overflow-hidden product-image-shell">
        <img src={product.image} alt={product.name} className="object-contain h-full w-full p-4 transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="p-4">
        <div className="font-bold text-base">{product.name}</div>
        <div className="text-xs text-shilaSilver mt-1 min-h-[32px]">{product.brand} • {compatibility}</div>
        <div className="mt-3 text-lg font-black text-shilaGoldLight">
          {product.price ? `KSh ${Number(product.price).toLocaleString()}` : 'REQUEST PRICE'}
        </div>
        <div className="mt-4 flex gap-2">
          <Link href={`/products/${product.slug}`}>
            <a className="flex-1 text-center px-3 py-2 border border-shilaGold/70 rounded-md font-bold text-xs hover:bg-shilaGold hover:text-black">VIEW DETAILS</a>
          </Link>
          <a href={`https://wa.me/254721802597?text=${encodeURIComponent(`Hello Shilatech Auto Spares, I am interested in ${product.name}${product.part_number ? `, part number ${product.part_number}` : ''}.`)}`} className="px-4 py-2 btn-accent rounded-md text-sm" aria-label={`WhatsApp about ${product.name}`}>◉</a>
        </div>
      </div>
    </div>
  )
}
