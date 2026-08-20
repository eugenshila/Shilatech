import Layout from '../../components/Layout';
import { products } from '../../data/products';
import { useCart } from '../../components/CartContext';
import Link from 'next/link';

export default function Product({ product }) {
  const { addToCart } = useCart();
  if (!product) return <Layout><div className="container section"><h1>Part not found</h1></div></Layout>;
  return <Layout>
    <section className="section"><div className="container productDetail">
      <div className="detailVisual"><div className="partGlyph large">{product.category.slice(0,2).toUpperCase()}</div><span>{product.brand}</span><small>{product.partNo}</small></div>
      <div className="detailInfo">
        <Link href="/shop" className="backLink">← Back to catalog</Link>
        <div className="productMeta"><span>{product.type}</span><span className="inStock">{product.stock} in stock</span></div>
        <h1>{product.name}</h1>
        <p className="detailPartNo">Part No. <strong>{product.partNo}</strong></p>
        <div className="detailPrice">KSh {product.price.toLocaleString()}</div>
        <p>Compatible with selected {product.brand} models. Confirm fitment with your VIN before purchase for best accuracy.</p>
        <div className="specGrid"><div><span>Models</span><b>{product.models.join(', ')}</b></div><div><span>Years</span><b>{product.years}</b></div><div><span>Engine</span><b>{product.engine}</b></div><div><span>Rating</span><b>★ {product.rating}</b></div></div>
        <button className="button primary largeBtn" onClick={()=>addToCart(product)}>Add to cart</button>
        <div className="fitmentCallout"><strong>Not sure this fits?</strong><span>Use our VIN checker before ordering.</span><Link href="/vin">Check VIN →</Link></div>
      </div>
    </div></section>
  </Layout>
}

export async function getStaticPaths(){
  return { paths: products.map(p=>({params:{slug:p.slug}})), fallback:false };
}
export async function getStaticProps({params}){
  return { props:{ product: products.find(p=>p.slug===params.slug) || null } };
}
