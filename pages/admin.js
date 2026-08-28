import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const emptyProduct = { name:'', brand:'Mercedes-Benz', category:'Engine', partNo:'', partType:'OEM', priceKes:'', stock:'0', years:'', models:'', engine:'' };
const emptyStaff = { name:'', email:'', phone:'', role:'cashier', password:'' };
const staffRoleLabels = { general_manager:'General manager', warehouse_manager:'Warehouse manager', warehouse_clerk:'Warehouse receiving staff', picker:'Warehouse picker', packer:'Warehouse packer', dispatch:'Dispatch staff', finance:'Finance staff', auditor:'Auditor', delivery_driver:'Delivery driver', cashier:'Sales counter staff', garage_staff:'Garage staff' };

export default function Admin(){
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [product,setProduct]=useState(emptyProduct);
  const [saving,setSaving]=useState(false);
  const [staff,setStaff]=useState(emptyStaff),[staffRoles,setStaffRoles]=useState(Object.keys(staffRoleLabels)),[staffSaving,setStaffSaving]=useState(false),[showStaff,setShowStaff]=useState(false);

  async function load(){
    setLoading(true); setError('');
    try{
      const [dashboard,accounts]=await Promise.all([fetch('/api/admin/overview'),fetch('/api/admin/staff')]);
      const j=await dashboard.json();
      if(!dashboard.ok) throw new Error(j.error||'Could not load admin dashboard.');
      setData(j);
      const a=await accounts.json();if(accounts.ok&&Array.isArray(a.roles))setStaffRoles(a.roles);
    }catch(e){ setError(e.message); }
    finally{ setLoading(false); }
  }

  async function addStaff(e){
    e.preventDefault(); setStaffSaving(true); setError('');
    try{const r=await fetch('/api/admin/staff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'CREATE',...staff})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not create staff account.');setStaff(emptyStaff);setShowStaff(false);await load();}
    catch(e){setError(e.message);}finally{setStaffSaving(false);}
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

  return <Layout>
    <section className="pageHero compactHero"><div className="container"><span className="eyebrow">DEALER CONTROL CENTER</span><h1>Admin dashboard</h1><p>Live inventory, orders, customers and sales performance. Net sales subtract approved refund credits; payouts are tracked separately.</p></div></section>
    <section className="section"><div className="container">
      {loading && <div className="panel"><p>Loading dashboard…</p></div>}
      {error && <div className="panel adminError"><h3>Admin access</h3><p>{error}</p>{error.toLowerCase().includes('sign in') && <a className="button primary" href="/staff-login?next=/admin">Staff / admin sign in</a>}</div>}
      {data && <>
        <div className="metrics"><div><span>Net sales today</span><strong>KSh {Number(data.metrics.salesToday||0).toLocaleString()}</strong></div><div><span>Open orders</span><strong>{data.metrics.openOrders}</strong></div><div><span>Low stock</span><strong>{data.metrics.lowStock}</strong></div><div><span>Customers</span><strong>{data.metrics.customers}</strong></div></div>

        <div className="panel adminStaffPanel"><div className="adminHeading"><div><span className="eyebrow">STAFF ACCESS</span><h2>Add staff account</h2><p>Create accounts for every department from this dashboard. The selected role controls available pages and actions.</p></div><button className="button primary" type="button" onClick={()=>setShowStaff(v=>!v)}>{showStaff?'Close form':'Add staff'}</button></div>{showStaff&&<form className="adminForm" onSubmit={addStaff}><div className="adminFormRow"><input required placeholder="Full name" value={staff.name} onChange={e=>setStaff({...staff,name:e.target.value})}/><input required type="email" placeholder="Staff email" value={staff.email} onChange={e=>setStaff({...staff,email:e.target.value})}/></div><div className="adminFormRow"><input placeholder="Phone number" value={staff.phone} onChange={e=>setStaff({...staff,phone:e.target.value})}/><select value={staff.role} onChange={e=>setStaff({...staff,role:e.target.value})}>{staffRoles.filter(r=>r!=='admin').map(r=><option value={r} key={r}>{staffRoleLabels[r]||r.replaceAll('_',' ')}</option>)}</select></div><input required minLength="8" type="password" autoComplete="new-password" placeholder="Temporary password (8+ characters)" value={staff.password} onChange={e=>setStaff({...staff,password:e.target.value})}/><button className="button primary" disabled={staffSaving}>{staffSaving?'Creating…':'Create staff account'}</button></form>}</div>

        <div className="adminSectionGrid">
          <div className="panel">
            <h2>Add product</h2><p><a href="/approvals">Price changes, refunds and corrections require approval.</a></p>
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
            {!data.recentOrders.length ? <p>No orders yet.</p> : <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Created</th></tr></thead><tbody>{data.recentOrders.map(o=><tr key={o.id}><td><strong>{o.order_no}</strong></td><td>{o.customer_name}</td><td>KSh {Number(o.total_kes).toLocaleString()}</td><td>{o.payment_status}<br/><small>{o.payment_method}</small></td><td><span>{o.status}</span><br/><a href="/approvals">Request correction</a></td><td>{new Date(o.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
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
