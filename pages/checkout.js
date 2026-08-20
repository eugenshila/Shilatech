import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useCart } from '../components/CartContext';

export default function Checkout(){
  const { cart, total, clearCart } = useCart();
  const [form,setForm]=useState({customerName:'',email:'',phone:'',deliveryAddress:'',deliveryZone:'Nairobi',paymentMethod:'M-Pesa'});
  const [result,setResult]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const delivery={Nairobi:500,'Greater Nairobi':800,Regional:1200,National:1500}[form.deliveryZone]||1500;

  const submit=async e=>{
    e.preventDefault();
    setBusy(true); setError(''); setResult(null);
    try{
      const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,items:cart.map(x=>({id:x.id,quantity:x.qty}))})});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||'Could not create order.');
      setResult(data.order);
      clearCart();
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };

  if(result) return <Layout><section className="pageHero compactHero"><div className="container"><span className="eyebrow">ORDER RECEIVED</span><h1>Thank you.</h1><p>Your order <strong>{result.orderNo}</strong> has been created.</p></div></section><section className="section"><div className="container narrow"><div className="panel"><h2>Order total: KSh {Number(result.total).toLocaleString()}</h2><p>Payment method: {result.paymentMethod}. Payment status is currently {result.paymentStatus}. We’ll activate the live payment request once the payment gateway credentials are connected.</p><Link className="button primary" href="/account">View my account</Link></div></div></section></Layout>;

  return <Layout><section className="pageHero compactHero"><div className="container"><span className="eyebrow">SECURE CHECKOUT</span><h1>Delivery & payment</h1><p>Complete your delivery details and choose a payment method.</p></div></section><section className="section"><div className="container cartLayout">
    <form className="contactForm panel" onSubmit={submit}>
      <h2>Customer details</h2>
      <input placeholder="Full name" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} required/>
      <input type="email" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
      <input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/>
      <textarea rows="4" placeholder="Delivery address" value={form.deliveryAddress} onChange={e=>setForm({...form,deliveryAddress:e.target.value})} required/>
      <label>Delivery zone<select value={form.deliveryZone} onChange={e=>setForm({...form,deliveryZone:e.target.value})}><option>Nairobi</option><option>Greater Nairobi</option><option>Regional</option><option>National</option></select></label>
      <label>Payment method<select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}><option>M-Pesa</option><option>Card</option><option>PayPal</option></select></label>
      {error && <p className="formError">{error}</p>}
      <button className="button primary" disabled={busy||!cart.length}>{busy?'Creating order…':'Place order'}</button>
    </form>
    <aside className="orderSummary"><h3>Order summary</h3>{cart.map(x=><div key={x.id}><span>{x.qty} × {x.name}</span><strong>KSh {(x.price*x.qty).toLocaleString()}</strong></div>)}<div><span>Subtotal</span><strong>KSh {total.toLocaleString()}</strong></div><div><span>Delivery</span><strong>KSh {delivery.toLocaleString()}</strong></div><hr/><div className="grandTotal"><span>Total</span><strong>KSh {(total+delivery).toLocaleString()}</strong></div></aside>
  </div></section></Layout>;
}
