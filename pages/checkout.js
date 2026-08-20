import { useMemo,useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useCart } from '../components/CartContext';

const localServices=[
  {code:'LOCAL_2H',name:'2 Hour Delivery',cost:1200,eta:'Within 2 hours'},
  {code:'LOCAL_4H',name:'4 Hour Delivery',cost:900,eta:'Within 4 hours'},
  {code:'LOCAL_8H',name:'8 Hour Delivery',cost:700,eta:'Within 8 hours'},
  {code:'LOCAL_NEXT',name:'Next Day Delivery',cost:500,eta:'Next business day'}
];

export default function Checkout(){
  const {cart,total,clearCart}=useCart();
  const [form,setForm]=useState({customerName:'',email:'',phone:'',deliveryAddress:'',destinationCountry:'Kenya',deliveryServiceCode:'LOCAL_NEXT',paymentMethod:'M-Pesa'});
  const [result,setResult]=useState(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const international=form.destinationCountry.trim().toLowerCase()!=='kenya';
  const selected=localServices.find(x=>x.code===form.deliveryServiceCode)||localServices[3];
  const quote=useMemo(()=>{
    if(!international)return {shipping:selected.cost,taxProvision:0,dutyProvision:0,eta:selected.eta,label:selected.name};
    const shipping=Math.max(4500,Math.round(total*0.08));
    const taxProvision=Math.round(total*0.20);
    return {shipping,taxProvision,dutyProvision:0,eta:'Estimated 5–10 business days after dispatch',label:'International Shipping — Estimate'};
  },[international,selected,total]);
  const grandTotal=total+quote.shipping+quote.taxProvision+quote.dutyProvision;

  const submit=async e=>{e.preventDefault();setBusy(true);setError('');setResult(null);try{const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,deliveryServiceCode:international?'INTL_EST':form.deliveryServiceCode,items:cart.map(x=>({id:x.id,quantity:x.qty}))})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not create order.');setResult(data.order);clearCart();}catch(err){setError(err.message)}finally{setBusy(false)}};

  if(result)return <Layout><section className="pageHero compactHero"><div className="container"><span className="eyebrow">ORDER RECEIVED</span><h1>Thank you.</h1><p>Your order <strong>{result.orderNo}</strong> has been created.</p></div></section><section className="section"><div className="container narrow"><div className="panel"><h2>Order total: KSh {Number(result.total).toLocaleString()}</h2><p><strong>Delivery:</strong> {result.deliveryService} · {result.deliveryEta}</p>{result.destinationCountry!=='Kenya'&&<p><strong>International estimate:</strong> shipping KSh {Number(result.delivery).toLocaleString()} + customs/tax provision KSh {Number(result.shippingTaxProvision||0).toLocaleString()}. Final courier and destination customs charges may vary.</p>}<p>Payment method: {result.paymentMethod}. Payment status is currently {result.paymentStatus}.</p><Link className="button primary" href="/account">View my account</Link></div></div></section></Layout>;

  return <Layout><section className="pageHero compactHero"><div className="container"><span className="eyebrow">SECURE CHECKOUT</span><h1>Delivery & payment</h1><p>Choose how quickly you need your parts delivered.</p></div></section><section className="section"><div className="container cartLayout">
    <form className="contactForm panel" onSubmit={submit}>
      <h2>Customer details</h2>
      <input placeholder="Full name" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} required/>
      <input type="email" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
      <input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/>
      <textarea rows="4" placeholder="Delivery address" value={form.deliveryAddress} onChange={e=>setForm({...form,deliveryAddress:e.target.value})} required/>
      <label>Destination country<input required value={form.destinationCountry} onChange={e=>setForm({...form,destinationCountry:e.target.value||'Kenya'})}/></label>
      {!international&&<label>Delivery speed<select value={form.deliveryServiceCode} onChange={e=>setForm({...form,deliveryServiceCode:e.target.value})}>{localServices.map(s=><option key={s.code} value={s.code}>{s.name} — KSh {s.cost.toLocaleString()}</option>)}</select></label>}
      {international&&<div className="shippingEstimate"><strong>International Shipping Estimate</strong><span>Estimated courier: KSh {quote.shipping.toLocaleString()}</span><span>Customs/tax provision: KSh {quote.taxProvision.toLocaleString()}</span><small>This is a provisional allowance only. Actual VAT, import duty, clearance and courier charges depend on the destination country and may be adjusted before dispatch.</small></div>}
      <div className="deliveryChoice"><strong>{quote.label}</strong><span>{quote.eta}</span></div>
      <label>Payment method<select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}><option>M-Pesa</option><option>Card</option><option>PayPal</option></select></label>
      {error&&<p className="formError">{error}</p>}
      <button className="button primary" disabled={busy||!cart.length}>{busy?'Creating order…':'Place order'}</button>
    </form>
    <aside className="orderSummary"><h3>Order summary</h3>{cart.map(x=><div key={x.id}><span>{x.qty} × {x.name}</span><strong>KSh {(x.price*x.qty).toLocaleString()}</strong></div>)}<div><span>Subtotal</span><strong>KSh {total.toLocaleString()}</strong></div><div><span>{international?'Estimated shipping':'Delivery'}</span><strong>KSh {quote.shipping.toLocaleString()}</strong></div>{international&&<div><span>Customs/tax provision</span><strong>KSh {quote.taxProvision.toLocaleString()}</strong></div>}<hr/><div className="grandTotal"><span>Estimated total</span><strong>KSh {grandTotal.toLocaleString()}</strong></div>{international&&<small>International customs/taxes are estimates and may change before dispatch.</small>}</aside>
  </div></section><style jsx>{`.shippingEstimate,.deliveryChoice{display:grid;gap:5px;border:1px solid #334039;background:#0b120e;padding:12px;border-radius:7px}.shippingEstimate strong,.deliveryChoice strong{color:#71ce45}.shippingEstimate span,.deliveryChoice span{font-size:12px}.shippingEstimate small,.orderSummary small{color:#8d979f;line-height:1.45}`}</style></Layout>;
}
