import Layout from '../../components/Layout';
import { useCart } from '../../components/CartContext';
import Link from 'next/link';
import { query } from '../../lib/db';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shilatech-auto-spares-production.up.railway.app').replace(/\/$/, '');

export default function Product({ product }) {
  const { addToCart } = useCart();
  if (!product) return <Layout noindex><div className="container section"><h1>Part not found</h1></div></Layout>;

  const recordedType = String(product.type || '').trim();
  const partType = recordedType.toLowerCase() === 'oem' ? 'OEM (Original Equipment Manufacturer)' : ['original', 'genuine'].includes(recordedType.toLowerCase()) ? 'Original/Genuine' : recordedType;
  const title = `${product.name} ${product.partNo} | Shilatech Kenya`;
  const overview = `${product.name}, part number ${product.partNo}, is listed${partType ? ` as ${partType}` : ''} in our ${product.category.toLowerCase()} catalogue for ${product.brand} vehicles. Check the listed model, year and engine details, then confirm the part number and VIN before ordering.`;
  const description = `${product.name}, part ${product.partNo}, ${recordedType ? `${recordedType} part. ` : ''}Kenya and East Africa enquiries welcome. Check fitment, price and stock with Shilatech.`;
  const productUrl = `${SITE_URL}/product/${product.slug}`;
  const productSchema = {
    '@context':'https://schema.org',
    '@type':'Product',
    name:product.name,
    sku:product.partNo,
    mpn:product.partNo,
    category:product.category,
    description:overview,
    ...(product.imageUrl ? {image:[product.imageUrl]} : {}),
    offers:{
      '@type':'Offer',
      url:productUrl,
      priceCurrency:'KES',
      price:String(product.price),
      availability:product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller:{'@type':'Organization',name:'Shilatech Auto Spares'}
    }
  };

  return <Layout title={title} description={description} image={product.imageUrl || undefined} canonicalPath={`/product/${product.slug}`} structuredData={[productSchema, {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE_URL},{'@type':'ListItem',position:2,name:'Auto spare parts',item:`${SITE_URL}/shop`},{'@type':'ListItem',position:3,name:product.name,item:productUrl}]}]}>
    <section className="section"><div className="container productDetail">
      <div className="detailVisual">{product.imageUrl ? <img src={product.imageUrl} alt={`${product.brand} ${product.name} ${product.partNo}`} style={{maxWidth:'100%',maxHeight:360,objectFit:'contain'}}/> : <div className="partGlyph large">{product.category.slice(0,2).toUpperCase()}</div>}<span>{product.brand}</span><small>{product.partNo}</small></div>
      <div className="detailInfo">
        <nav aria-label="Breadcrumb" className="backLink"><Link href="/">Home</Link> / <Link href="/shop">Auto spare parts</Link> / <span>{product.name}</span></nav>
        <div className="productMeta"><span>{partType}</span><span className={product.stock > 0 ? 'inStock' : ''}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span></div>
        <h1>{product.name}</h1>
        <p className="detailPartNo">Part No. <strong>{product.partNo}</strong></p>
        <div className="detailPrice">KSh {Number(product.price).toLocaleString()}</div>
        <p>{overview}</p>
        <h2 style={{fontSize:24,marginTop:28}}>Listed vehicle compatibility</h2>
        <div className="specGrid"><div><span>Listed models</span><b>{product.models.length ? product.models.join(', ') : 'Confirm by VIN'}</b></div><div><span>Years</span><b>{product.years || 'Varies'}</b></div><div><span>Engine</span><b>{product.engine || 'Varies'}</b></div><div><span>Part type</span><b>{partType || 'Contact us to confirm'}</b></div></div>
        <button disabled={product.stock <= 0} className="button primary largeBtn" onClick={()=>addToCart(product)}>{product.stock > 0 ? 'Add to cart' : 'Currently unavailable'}</button>
        <div className="fitmentCallout"><strong>Not sure this fits?</strong><span>Use our VIN checker before ordering.</span><Link href="/vin">Check VIN →</Link></div>
      </div>
    </div></section>
    <section className="section"><div className="container narrow prose">
      <h2>Before ordering {product.name}</h2>
      <p>Parts can differ between vehicles with the same model name. Check your vehicle year, engine and the number on the existing part against this listing. The compatibility details above are a starting point, not a guarantee of fitment for every vehicle.</p>
      <ul style={{lineHeight:1.8}}>
        <li>Quote part number <strong>{product.partNo}</strong> when contacting us.</li>
        <li>Have your 17-character VIN and vehicle details ready.</li>
        <li>If the existing part number differs, ask us to confirm a suitable replacement before paying.</li>
      </ul>
      <h2>Price, availability and delivery in Kenya</h2>
      <p>The current listed price is KSh {Number(product.price).toLocaleString()}. {product.stock > 0 ? 'This part is currently listed in stock. Availability may change before your order is confirmed.' : 'This part is currently out of stock. Contact us to ask about availability before planning your repair.'} Confirm delivery charges and timing for your location before ordering.</p>
      <p><Link href="/delivery-returns">Read delivery and returns information</Link> or <Link href="/contact">contact Shilatech about this part</Link>.</p>
      <h2>Parts enquiries from Kenya and East Africa</h2>
      <p>We welcome enquiries about this part from customers and workshops across East Africa. Share your part number, vehicle details and destination with Shilatech so we can confirm availability and discuss delivery arrangements before you order.</p>
      <h2>Need help identifying a part?</h2>
      <p>Start with our <Link href="/vin">VIN lookup</Link>, or send the team your vehicle details and a clear photograph of the existing part and its markings. You can also <Link href={`/shop?brand=${encodeURIComponent(product.brand)}`}>browse other {product.brand} spare parts</Link>.</p>
    </div></section>
  </Layout>
}

export async function getServerSideProps({params,res}){
  res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=600');
  try{
    const result=await query(`SELECT id,slug,name,brand,category,part_no AS "partNo",part_type AS type,price_kes AS price,stock,years,models,engine,rating,image_url AS "imageUrl" FROM products WHERE slug=$1 AND active=TRUE LIMIT 1`,[params.slug]);
    if(!result.rowCount) return {notFound:true};
    const p=result.rows[0];
    return {props:{product:{...p,price:Number(p.price),stock:Number(p.stock),rating:Number(p.rating||0),models:Array.isArray(p.models)?p.models:[]}}};
  }catch(error){console.error(error);return {notFound:true};}
}
