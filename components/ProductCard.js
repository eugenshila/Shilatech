import Link from 'next/link';
import { useCart } from './CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  return (
    <article className="productCard">
      <Link href={`/product/${product.slug}`} className="productImage">
        <span className="partGlyph">{product.category.slice(0,2).toUpperCase()}</span>
        <em>{product.brand}</em>
      </Link>
      <div className="productBody">
        <div className="productMeta"><span>{product.type}</span><span className={product.stock>0?'inStock':'outStock'}>{product.stock>0?'In stock':'Backorder'}</span></div>
        <Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
        <p className="partNo">Part No. {product.partNo}</p>
        <div className="priceRow"><strong>KSh {product.price.toLocaleString()}</strong><span>★ {product.rating}</span></div>
        <button className="button secondary full" onClick={() => addToCart(product)}>Add to cart</button>
      </div>
    </article>
  );
}
