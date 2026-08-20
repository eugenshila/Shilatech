import Link from 'next/link';
import Layout from '../components/Layout';
import { useCart } from '../components/CartContext';

export default function Cart(){
  const {cart,removeFromCart,setQty,total}=useCart();
  return <Layout><section className="pageHero compactHero"><div className="container"><span className="eyebrow">YOUR ORDER</span><h1>Shopping cart</h1></div></section>
    <section className="section"><div className="container cartLayout">
      <div className="cartItems">
        {!cart.length && <div className="emptyState"><h3>Your cart is empty</h3><p>Browse premium parts and add what you need.</p><Link className="button primary" href="/shop">Shop parts</Link></div>}
        {cart.map(x=><div className="cartItem" key={x.id}><div className="miniPart">{x.category.slice(0,2)}</div><div><h3>{x.name}</h3><p>{x.partNo} • {x.brand}</p></div><input type="number" min="1" value={x.qty} onChange={e=>setQty(x.id,Number(e.target.value)||1)}/><strong>KSh {(x.price*x.qty).toLocaleString()}</strong><button onClick={()=>removeFromCart(x.id)}>×</button></div>)}
      </div>
      <aside className="orderSummary"><h3>Order summary</h3><div><span>Subtotal</span><strong>KSh {total.toLocaleString()}</strong></div><div><span>Delivery</span><span>Calculated at checkout</span></div><hr/><div className="grandTotal"><span>Total</span><strong>KSh {total.toLocaleString()}</strong></div>{cart.length?<Link className="button primary full" href="/checkout">Proceed to checkout</Link>:<button className="button primary full" disabled>Proceed to checkout</button>}<small>M-Pesa, card and PayPal choices are available in checkout; live gateway requests require credentials.</small></aside>
    </div></section>
  </Layout>
}
