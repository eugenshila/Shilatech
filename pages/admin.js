import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const emptyProduct = { name:'', brand:'Mercedes-Benz', category:'Engine', partNo:'', partType:'OEM', priceKes:'', stock:'0', years:'', models:'', engine:'' };

export default function Admin(){
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [product,setProduct]=useState(emptyProduct);
  const [saving,setSaving]=useState(false);

  async function load(){
    setLoading(true); setError('');
    try{
      const r=await fetch('/api/admin/overview');
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Could not load admin dashboard.');
      setData(j);
    }catch(e){ setError(e.message); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); },[]);

  async function addProduct(e){
    e.preventDefault(); setSaving(true); setError('');
    try{
      const r=await fetch('/api/admin/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...product,priceKes:Number(product.priceKes),stock:Number(product.stock)})});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Could not add product.');
      setProduct(emptyProduct); await load();
    }catch(e){ setError(e.message); }
    finally{ setSaving(false); }
  }

  async function updateOrder(id,status){
    const r=await fetch('/api/admin/orders',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});
    const j=await r.json();
    if(!r.ok){ setError(j.error||'Could not update order.'); return; }
    await load();
  }

  return <Layout>
    <section className="pageHero compactHero"><div className="container"><span className="eyebrow">DEALER CONTROL CENTER</span><h1>Admin dashboard</h1><p>Live inventory, orders, customers and sales performance.</p></div></section>
    <section className="section"><div className="container">
      {loading && <div className="panel"><p>Loading dashboard…</p></div>}
      {error && <div className="panel adminError"><h3>Admin access</h3><p>{error}</p>{error.toLowerCase().includes('sign in') && <a className="button primary" href="/account">Customer / admin login</a>}</div>}
      {data && <>
        <div className="metrics"><div><span>Sales today</span><strong>KSh {Number(data.metrics.salesToday||0).toLocaleString()}</strong></div><div><span>Open orders</span><strong>{data.metrics.openOrders}</strong></div><div><span>Low stock</span><strong>{data.metrics.lowStock}</strong></div><div><span>Customers</span><strong>{data.metrics.customers}</strong></div></div>

        <div className="adminSectionGrid">
          <div className="panel">
            <h2>Add product</h2>
            <form className="adminForm" onSubmit={addProduct}>
              <input required placeholder="Product name" value={product.name} onChange={e=>setProduct({...product,name:e.target.value})}/>
              <div className="adminFormRow"><select value={product.brand} onChange={e=>setProduct({...product,brand:e.target.value})}><option>Mercedes-Benz</option><option>Jeep</option><option>Volkswagen</option><option>Range Rover</option><option>Volvo</option></select><select value={product.category} onChange={e=>setProduct({...product,category:e.target.value})}><option>Engine</option><option>Brakes</option><option>Suspension</option><option>Electrical</option><option>Body</option><option>Interior</option></select></div>
              <div className="adminFormRow"><input required placeholder="Part number" value={product.partNo} onChange={e=>setProduct({...product,partNo:e.target.value})}/><select value={product.partType} onChange={e=>setProduct({...product,partType:e.target.value})}><option>OEM</option><option>Aftermarket</option></select></div>
              <div className="adminFormRow"><input required type="number" min="0" placeholder="Price KSh" value={product.priceKes} onChange={e=>setProduct({...product,priceKes:e.target.value})}/><input required type="number" min="0" placeholder="Stock" value={product.stock} onChange={e=>setProduct({...product,stock:e.target.value})}/></div>
              <input placeholder="Years e.g. 2015–2021" value={product.years} onChange={e=>setProduct({...product,years:e.target.value})}/>
              <input placeholder="Compatible models, comma separated" value={product.models} onChange={e=>setProduct({...product,models:e.target.value})}/>
              <input placeholder="Engine / fitment note" value={product.engine} onChange={e=>setProduct({...product,engine:e.target.value})}/>
              <button className="button primary" disabled={saving}>{saving?'Saving…':'Add product'}</button>
            </form>
          </div>

          <div className="panel adminWide">
            <div className="adminHeading"><div><span className="eyebrow">ORDERS</span><h2>Recent order pipeline</h2></div><button className="button secondary" onClick={load}>Refresh</button></div>
            {!data.recentOrders.length ? <p>No orders yet.</p> : <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Created</th></tr></thead><tbody>{data.recentOrders.map(o=><tr key={o.id}><td><strong>{o.order_no}</strong></td><td>{o.customer_name}</td><td>KSh {Number(o.total_kes).toLocaleString()}</td><td>{o.payment_status}<br/><small>{o.payment_method}</small></td><td><select value={o.status} onChange={e=>updateOrder(o.id,e.target.value)}><option>Pending</option><option>Processing</option><option>Shipped</option><option>Out for Delivery</option><option>Delivered</option><option>Cancelled</option></select></td><td>{new Date(o.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
          </div>
        </div>

        <div className="panel adminInventory">
          <div className="adminHeading"><div><span className="eyebrow">INVENTORY</span><h2>Products</h2></div><span>{data.products.length} shown</span></div>
          <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Part</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>State</th></tr></thead><tbody>{data.products.map(p=><tr key={p.id}><td><strong>{p.name}</strong><br/><small>{p.part_no}</small></td><td>{p.brand}</td><td>{p.category}</td><td>KSh {Number(p.price_kes).toLocaleString()}</td><td className={p.stock<=5?'stockLow':''}>{p.stock}</td><td>{p.active?'Active':'Hidden'}</td></tr>)}</tbody></table></div>
        </div>
      </>}
    </div></section>
    <style jsx>{`
      .adminError{margin-bottom:20px}.adminSectionGrid{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(0,1.7fr);gap:18px;margin-bottom:18px}.adminWide{min-width:0}.adminForm{display:grid;gap:10px}.adminForm input,.adminForm select,.adminTable select{width:100%;background:#090c10;color:#edf1f5;border:1px solid #323a44;border-radius:6px;padding:11px}.adminFormRow{display:grid;grid-template-columns:1fr 1fr;gap:10px}.adminHeading{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:16px}.adminHeading h2,.panel h2{margin:0 0 12px}.adminHeading .eyebrow{margin-bottom:5px}.adminTableWrap{overflow:auto}.adminTable{width:100%;border-collapse:collapse;min-width:720px}.adminTable th,.adminTable td{text-align:left;padding:12px 10px;border-bottom:1px solid #252d35;font-size:12px;vertical-align:middle}.adminTable th{color:#7f8a95;text-transform:uppercase;letter-spacing:.08em;font-size:10px}.adminTable small{color:#78838e}.stockLow{color:#f0a45d;font-weight:800}.adminInventory{margin-top:18px}@media(max-width:900px){.adminSectionGrid{grid-template-columns:1fr}.adminFormRow{grid-template-columns:1fr}}
    `}</style>
  </Layout>
}
