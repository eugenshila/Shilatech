import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

const money=value=>'KSh '+Number(value||0).toLocaleString('en-KE');
const pendingKey='shilatech-counter-pending';

export default function Counter(){
 const [data,setData]=useState(null),[query,setQuery]=useState(''),[cart,setCart]=useState([]);
 const [method,setMethod]=useState('Cash'),[reference,setReference]=useState(''),[tendered,setTendered]=useState(''),[customer,setCustomer]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState(null),[pending,setPending]=useState(null),[loading,setLoading]=useState(true);
 const submitting=useRef(false),requestNumber=useRef(0);
 const total=cart.reduce((sum,p)=>sum+Number(p.price_kes)*p.quantity,0);
 async function load(q=''){
  const n=++requestNumber.current;
  try{const r=await fetch('/api/pos?q='+encodeURIComponent(q));const d=await r.json();if(!r.ok)throw new Error(d.error);if(n===requestNumber.current)setData(d);}
  catch(e){if(n===requestNumber.current){setData(null);setError(e.message);}}
  finally{if(n===requestNumber.current)setLoading(false);}
 }
 useEffect(()=>{try{const saved=sessionStorage.getItem(pendingKey);if(saved)setPending(JSON.parse(saved));}catch{}load();},[]);
 function add(p){
  setError('');setReceipt(null);
  setCart(old=>{const existing=old.find(x=>x.id===p.id);if((existing?.quantity||0)>=Number(p.available_qty))return old;return existing?old.map(x=>x.id===p.id?{...x,quantity:x.quantity+1}:x):[...old,{...p,quantity:1}];});
 }
 async function sell(){
  if(submitting.current)return;
  submitting.current=true;setBusy(true);setError('');setReceipt(null);
  try{
   const payload=pending||{requestKey:crypto.randomUUID(),items:cart.map(p=>({id:p.id,quantity:p.quantity})),paymentMethod:method,paymentReference:reference,tenderedKes:method==='Cash'?Number(tendered):total,expectedTotalKes:total,customerName:customer};
   // Persist before sending so an uncertain response can be retried without a second sale.
   sessionStorage.setItem(pendingKey,JSON.stringify(payload));setPending(payload);
   const r=await fetch('/api/pos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const d=await r.json();
   if(!r.ok){if(r.status>=400&&r.status<500){sessionStorage.removeItem(pendingKey);setPending(null);}throw new Error(d.error||'Sale could not be recorded.');}
   sessionStorage.removeItem(pendingKey);setPending(null);setReceipt(d.receipt);setCart([]);setReference('');setTendered('');setCustomer('');await load(query);
  }catch(e){setError(e.message||'Connection interrupted. Retry the pending sale to check its result.');}
  finally{submitting.current=false;setBusy(false);}
 }
 async function openReceipt(id){setError('');try{const r=await fetch('/api/pos?saleId='+id);const d=await r.json();if(!r.ok)throw new Error(d.error);setReceipt(d.receipt);}catch(e){setError(e.message);}}
 return <Layout title="Warehouse Counter | Shilatech" noindex>
  <div className="counterShell">
   <div className="counterTop noPrint"><div><span className="eyebrow">SHILATECH · STAFF</span><h1>Warehouse counter</h1><p>{data?`${data.user.location_name} · ${data.user.name}`:'Sign in using your existing staff account.'}</p></div><div><Link href="/account">Staff account</Link> · <Link href="/warehouse">Warehouse</Link> · <Link href="/operations">Management</Link></div></div>
   {error&&<p className="counterError noPrint" role="alert">{error}</p>}
   {loading&&<p>Loading counter…</p>}
   {!loading&&!data&&<p className="noPrint"><Link href="/account">Sign in</Link>, then <button onClick={()=>{setError('');load(query);}}>reload the counter</button>. An administrator or assigned cashier account is required.</p>}
   {data&&<>
    <div className="counterSummary noPrint"><div><strong>Today · Nairobi time</strong><p>{data.user.role==='cashier'?'Your counter sales':'All counter sales at this location'} · excludes online orders</p></div>{data.daily.map(d=><div key={d.payment_method}><span>{d.payment_method} · {d.sales} sales</span><strong>{money(d.total_kes)}</strong></div>)}</div>
    {pending&&<div className="counterNotice noPrint"><strong>A sale is awaiting confirmation.</strong><p>Retry it with the same details to retrieve its receipt safely. Do not collect payment again.</p><button className="button primary" disabled={busy} onClick={sell}>{busy?'Checking…':'Check / retry pending sale'}</button></div>}
    <div className="counterGrid noPrint">
     <section className="counterCard"><h2>Find a part</h2><form onSubmit={e=>{e.preventDefault();load(query);}} className="counterSearch"><label className="sr-only" htmlFor="partSearch">Part name, number or barcode</label><input id="partSearch" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Scan barcode or search part number / name"/><button className="button primary">Search</button></form><p>Physical − reserved online = available to sell. Search results are checked again at payment.</p>
      <div className="counterProducts">{data.products.map(p=><article key={p.id}><div><small>{p.part_no}</small><h3>{p.name}</h3><p>{money(p.price_kes)} · Physical {p.physical_qty} · Reserved {p.reserved_qty} · Available {p.available_qty}</p>{!p.reconciled&&<span className="counterWarning">Manager stock check required</span>}</div><button disabled={busy||!!pending||!p.reconciled||Number(p.available_qty)<1} onClick={()=>add(p)}>Add</button></article>)}{!data.products.length&&<p>No matching parts.</p>}</div>
     </section>
     <section className="counterCard"><h2>Counter sale</h2><fieldset disabled={busy||!!pending}><legend className="sr-only">Sale details</legend>
      {!cart.length&&<p>Add a part to start a sale.</p>}
      {cart.map(p=><div className="counterLine" key={p.id}><div><strong>{p.name}</strong><small>{p.part_no} · {money(p.price_kes)}</small></div><label>Qty<input type="number" min="1" max={p.available_qty} value={p.quantity} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>0&&n<=Number(p.available_qty))setCart(cart.map(x=>x.id===p.id?{...x,quantity:n}:x));}}/></label><button aria-label={'Remove '+p.name} onClick={()=>setCart(cart.filter(x=>x.id!==p.id))}>×</button></div>)}
      <div className="counterTotal"><span>Total</span><strong>{money(total)}</strong></div>
      <label>Customer name (optional)<input maxLength="160" value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Walk-in customer"/></label>
      <label>Payment method<select value={method} onChange={e=>setMethod(e.target.value)}><option>Cash</option><option>M-Pesa</option><option>Card</option></select></label>
      {method==='Cash'?<><label>Cash received (whole KSh)<input type="number" min={total} step="1" value={tendered} onChange={e=>setTendered(e.target.value)}/></label><p>Change: {money(Math.max(Number(tendered)-total,0))}</p></>:<><label>Confirmed payment reference<input maxLength="100" value={reference} onChange={e=>setReference(e.target.value)} /></label><p>This records a payment already received. Verify {money(total)} in the merchant account or card terminal first. This screen does not charge the customer.</p></>}
      <button className="button primary counterPay" disabled={!cart.length||total<1||(method==='Cash'?Number(tendered)<total:!reference.trim())} onClick={sell}>Record paid sale · {money(total)}</button>
     </fieldset></section>
    </div>
    <section className="counterCard noPrint"><h2>Recent receipts</h2><p>Reprint a receipt here if a browser window was closed.</p><div className="counterRecent">{data.recent.map(s=><button key={s.id} onClick={()=>openReceipt(s.id)}>{new Date(s.created_at).toLocaleString('en-KE',{timeZone:'Africa/Nairobi'})} · {s.payment_method} · {money(s.total_kes)}<small>{s.sale_no}</small></button>)}</div></section>
   </>}
   {receipt&&<section className="counterReceipt" aria-live="polite"><h2>SHILATECH AUTO SPARES</h2><p>{receipt.location_name}</p><p className="receiptNumber">{receipt.sale_no}</p><p>{new Date(receipt.created_at).toLocaleString('en-KE',{timeZone:'Africa/Nairobi'})} EAT<br/>Cashier: {receipt.cashier_name}<br/>Customer: {receipt.customer_name}</p><table><thead><tr><th>Part</th><th>Qty</th><th>Total</th></tr></thead><tbody>{receipt.items.map((p,i)=><tr key={i}><td>{p.name}<br/><small>{p.part_no} · {money(p.unit_price_kes)}</small></td><td>{p.quantity}</td><td>{money(p.line_total_kes)}</td></tr>)}</tbody></table><h3>Total paid: {money(receipt.total_kes)}</h3><p>{receipt.payment_method}{receipt.payment_reference?' · '+receipt.payment_reference:''}<br/>Received: {money(receipt.tendered_kes)} · Change: {money(receipt.change_kes)}</p><p>Sales receipt. Not a tax invoice.</p><button className="button primary noPrint" onClick={()=>window.print()}>Print receipt</button></section>}
  </div>
 </Layout>;
}
