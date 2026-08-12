import { useRouter } from 'next/router'
import products from '../../data/products.json'

export default function ProductPage(){
  const router = useRouter()
  const { slug } = router.query
  if(!slug) return null
  const product = products.find((p:any) => p.slug === slug)
  if(!product) return <div className="pt-24 max-w-3xl mx-auto px-4">Product not found.</div>

  return (
    <div className="pt-24 max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 p-4 flex items-center justify-center">
          <img src={product.image} alt={product.name} className="object-contain h-80" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="text-sm text-shilaSilver mt-2">{product.brand} • {product.category}</div>
          <div className="mt-4">
            <div><strong>Part Number:</strong> {product.part_number}</div>
            <div className="mt-1"><strong>OEM:</strong> {product.oem_number}</div>
            <div className="mt-1"><strong>Compatibility:</strong> {product.compatibility.join(', ')}</div>
            <div className="mt-4 text-lg font-bold">{product.price? `KSh ${product.price}` : 'Request Price'}</div>
          </div>

          <div className="mt-6 flex gap-3">
            <a href={`https://wa.me/254721802597?text=Hello%20I%20need%20${encodeURIComponent(product.name)}%20for%20my%20vehicle`} className="px-4 py-2 btn-accent rounded-md">WhatsApp Enquiry</a>
            <a href="tel:+254721802597" className="px-4 py-2 border border-white/10 rounded-md">Call Us</a>
          </div>

          <div className="mt-8 p-4 card rounded-lg">
            <h3 className="font-semibold">Not sure which part fits your vehicle?</h3>
            <p className="text-sm text-shilaSilver mt-2">Send us your registration number, VIN/chassis number or vehicle details and our team will assist you.</p>
          </div>

        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold">Product Description</h3>
        <p className="mt-2 text-shilaSilver">{product.description}</p>
      </div>
    </div>
  )
}
