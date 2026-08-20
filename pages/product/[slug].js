import Layout from '../../components/Layout';
import { useCart } from '../../components/CartContext';
import Link from 'next/link';
import { query } from '../../lib/db';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shilatech-auto-spares-production.up.railway.app').replace(/\/$/, '');

export default function Product({ product }) {
  const { addToCart } = useCart();
  if (!product) return <Layout noindex><div className="container section"><h1>Part not found</h1></div></Layout>;

  const title = `${product.name} ${product.partNo} | ${product.brand} Spare Parts Kenya`;
  const description = `Buy ${product.name} (${product.partNo}) for ${product.brand} in Kenya. ${product.type} part, KSh ${Number(product.price).toLocaleString()}, ${product.stock > 0 ? `${product.stock} currently in stock` : 'contact us for availability'}. VIN fitment support and delivery across Kenya.`;
  const productUrl = `${SITE_URL}/product/${product.slug}`;
  const productSchema = {
    '@context':'https://schema.org',
    '@type':'Product',
    name:product.name,
    sku:product.partNo,
    mpn:product.partNo,
    brand:{'@type':'Brand',name:product.brand},
    description,
    ...(product.imageUrl ? {image:[product.imageUrl]} : {}),
    offers:{
      '@type':'Offer',
      url:productUrl,
      priceCurrency:'KES',
      price:String(product.price),
      availability:product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition:'https://schema.org/NewCondition',
      seller:{'@type':'Organization',name:'Shilatech Auto Spares'}
    }
  };

  return <Layout title={title} description={description} image={product.imageUrl || undefined} canonicalPath={`/product/${product.slug}`} structuredData={productSchema}>
    <section className="section"><div className="container productDetail">
      <div className="detailVisual">{product.imageUrl ? <img src={product.imageUrl} alt={`${product.brand} ${product.name} ${product.partNo}`} style={{maxWidth:'100%',maxHeight:360,objectFit:'contain'}}/> : <div className="partGlyph large">{product.category.slice(0,2).toUpperCase()}</div>}<span>{product.brand}</span><small>{product.partNo}</small></div>
      <div className="detailInfo">
        <Link href="/shop" className="backLink">← Back to catalog</Link>
        <div className="productMeta"><span>{product.type}</span><span className={product.stock > 0 ? 'inStock' : ''}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span></div>
        <h1>{product.name}</h1>
        <p className="detailPartNo">Part No. <strong>{product.partNo}</strong></p>
        <div className="detailPrice">KSh {Number(product.price).toLocaleString()}</div>
        <p>Compatible with selected {product.brand} models. Confirm fitment with your VIN before purchase for best accuracy.</p>
        <div className="specGrid"><div><span>Models</span><b>{product.models.length ? product.models.join(', ') : 'Confirm by VIN'}</b></div><div><span>Years</span><b>{product.years || 'Varies'}</b></div><div><span>Engine</span><b>{product.engine || 'Varies'}</b></div><div><span>Part type</span><b>{product.type}</b></div></div>
        <button disabled={product.stock <= 0} className="button primary largeBtn" onClick={()=>addToCart(product)}>{product.stock > 0 ? 'Add to cart' : 'Currently unavailable'}</button>
        <div className="fitmentCallout"><strong>Not sure this fits?</strong><span>Use our VIN checker before ordering.</span><Link href="/vin">Check VIN →</Link></div>
      </div>
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
