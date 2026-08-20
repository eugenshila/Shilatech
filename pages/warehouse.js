import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';

const emptyReceipt={productId:'',warehouseId:'',quantity:'',batchNo:'',supplierName:'',supplierRef:'',binCode:'',unitCostKes:''};
const emptyPreorder={productId:'',customerName:'',phone:'',email:'',quantity:'',expectedAt:'',notes:''};
const emptyReturn={productId:'',quantity:'',reason:'Factory defect',defectType:'',disposition:'QUARANTINE',notes:''};

export default function Warehouse(){
  const [data,setData]=useState(null); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const [receipt,setReceipt]=useState(emptyReceipt); const [preorder,setPreorder]=useState(emptyPreorder); const [ret,setRet]=useState(emptyReturn);
  async function load(){
    setError('');
    try{const r=await fetch('/api/warehouse/overview');const j=await r.json();if(!r.ok) throw new Error(j.error||'Could not load warehouse.');setData(j);}catch(e){setError(e.message);}
  }
  useEffect(()=>{load();},[]);
  const products=useMemo(()=>data?.products||[],[data]); const warehouses=data?.warehouses||[];
  async function send(url,body,reset){setBusy(true);setError('');try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok) throw new Error(j.error||'Action failed.');reset();await load();}catch(e){setError(e.message);}finally{setBusy(false);}}

  return <Layout>
    <section className="pageHero compactHero"><div className="container"><span className="eyebrow">PRIVATE STAFF PORTAL</span><h1>Warehouse & 3PL Operations</h1><p>FIFO inventory, receiving, barcode labels, preorders, returns and defect quarantine. Authorized employees only.</p></div></section>
    <section className="section warehousePage"><div className="container">
      {error&&<div className="warehouseAlert">{error}</div>}
      {!data&&!error&&<p>Loading warehouse…</p>}
      {data&&<>
        <div className="warehouseMetrics">
          <div><span>Units on hand</span><strong>{data.metrics.units_on_hand}</strong></div>
          <div><span>Active FIFO batches</span><strong>{data.metrics.active_batches}</strong></div>
          <div><span>Aged batches 180+ days</span><strong>{data.metrics.aged_batches}</strong></div>
          <div><span>Open preorders</span><strong>{data.preorders.length}</strong></div>
        </div>

        <div className="warehouseForms">
          <form className="warehousePanel" onSubmit={e=>{e.preventDefault();send('/api/warehouse/receive',{...receipt,productId:Number(receipt.productId),warehouseId:Number(receipt.warehouseId),quantity:Number(receipt.quantity),unitCostKes:receipt.unitCostKes===''?null:Number(receipt.unitCostKes)},()=>setReceipt(emptyReceipt));}}>
            <h2>Receive stock</h2><p>Creates a dated receipt batch for FIFO allocation.</p>
            <label>Part<select required value={receipt.productId} onChange={e=>setReceipt({...receipt,productId:e.target.value})}><option value="">Select part</option>{products.map(p=><option value={p.id} key={p.id}>{p.part_no} — {p.name}</option>)}</select></label>
            <label>Warehouse<select required value={receipt.warehouseId} onChange={e=>setReceipt({...receipt,warehouseId:e.target.value})}><option value="">Select warehouse</option>{warehouses.map(w=><option value={w.id} key={w.id}>{w.code} — {w.name}</option>)}</select></label>
            <label>Quantity<input required type="number" min="1" value={receipt.quantity} onChange={e=>setReceipt({...receipt,quantity:e.target.value})}/></label>
            <label>Batch / GRN number<input required value={receipt.batchNo} onChange={e=>setReceipt({...receipt,batchNo:e.target.value})}/></label>
            <label>Bin code<input placeholder="e.g. A-01-02" value={receipt.binCode} onChange={e=>setReceipt({...receipt,binCode:e.target.value})}/></label>
            <label>Supplier<input value={receipt.supplierName} onChange={e=>setReceipt({...receipt,supplierName:e.target.value})}/></label>
            <label>Supplier reference<input value={receipt.supplierRef} onChange={e=>setReceipt({...receipt,supplierRef:e.target.value})}/></label>
            <label>Unit cost (KSh)<input type="number" min="0" value={receipt.unitCostKes} onChange={e=>setReceipt({...receipt,unitCostKes:e.target.value})}/></label>
            <button disabled={busy} className="button greenPrimary">Receive into stock</button>
          </form>

          <form className="warehousePanel" onSubmit={e=>{e.preventDefault();send('/api/warehouse/preorders',{...preorder,productId:Number(preorder.productId),quantity:Number(preorder.quantity)},()=>setPreorder(emptyPreorder));}}>
            <h2>Create preorder</h2><p>Records demand for stock not yet available.</p>
            <label>Part<select required value={preorder.productId} onChange={e=>setPreorder({...preorder,productId:e.target.value})}><option value="">Select part</option>{products.map(p=><option value={p.id} key={p.id}>{p.part_no} — {p.name}</option>)}</select></label>
            <label>Customer name<input required value={preorder.customerName} onChange={e=>setPreorder({...preorder,customerName:e.target.value})}/></label>
            <label>Phone<input value={preorder.phone} onChange={e=>setPreorder({...preorder,phone:e.target.value})}/></label>
            <label>Email<input type="email" value={preorder.email} onChange={e=>setPreorder({...preorder,email:e.target.value})}/></label>
            <label>Quantity<input required type="number" min="1" value={preorder.quantity} onChange={e=>setPreorder({...preorder,quantity:e.target.value})}/></label>
            <label>Expected date<input type="date" value={preorder.expectedAt} onChange={e=>setPreorder({...preorder,expectedAt:e.target.value})}/></label>
            <label>Notes<textarea rows="3" value={preorder.notes} onChange={e=>setPreorder({...preorder,notes:e.target.value})}/></label>
            <button disabled={busy} className="button greenPrimary">Save preorder</button>
          </form>

          <form className="warehousePanel" onSubmit={e=>{e.preventDefault();send('/api/warehouse/returns',{...ret,productId:Number(ret.productId),quantity:Number(ret.quantity)},()=>setRet(emptyReturn));}}>
            <h2>Return / factory defect</h2><p>Defective parts default to quarantine and remain out of sellable stock.</p>
            <label>Part<select required value={ret.productId} onChange={e=>setRet({...ret,productId:e.target.value})}><option value="">Select part</option>{products.map(p=><option value={p.id} key={p.id}>{p.part_no} — {p.name}</option>)}</select></label>
            <label>Quantity<input required type="number" min="1" value={ret.quantity} onChange={e=>setRet({...ret,quantity:e.target.value})}/></label>
            <label>Reason<select value={ret.reason} onChange={e=>setRet({...ret,reason:e.target.value})}><option>Factory defect</option><option>Customer return</option><option>Wrong part</option><option>Transit damage</option><option>Warranty issue</option></select></label>
            <label>Defect type<input placeholder="e.g. cracked housing" value={ret.defectType} onChange={e=>setRet({...ret,defectType:e.target.value})}/></label>
            <label>Disposition<select value={ret.disposition} onChange={e=>setRet({...ret,disposition:e.target.value})}><option>QUARANTINE</option><option>SUPPLIER_RETURN</option><option>REPAIR</option><option>WRITE_OFF</option></select></label>
            <label>Notes<textarea rows="3" value={ret.notes} onChange={e=>setRet({...ret,notes:e.target.value})}/></label>
            <button disabled={busy} className="button greenPrimary">Record return</button>
          </form>
        </div>

        <div className="warehousePanel warehouseWide">
          <div className="warehousePanelHead"><div><h2>FIFO stock batches</h2><p>Oldest available batch appears first and is used first during issue/picking.</p></div></div>
          <div className="warehouseTableWrap"><table className="warehouseTable"><thead><tr><th>Part</th><th>Batch</th><th>Received</th><th>Available</th><th>Warehouse / Bin</th><th>Supplier</th><th>Barcode</th></tr></thead><tbody>{data.batches.map(b=><tr key={b.id}><td><b>{b.part_no}</b><small>{b.name}</small></td><td>{b.batch_no}</td><td>{new Date(b.received_at).toLocaleDateString()}</td><td>{b.available_qty}/{b.received_qty}</td><td>{b.warehouse}<small>{b.bin_code||'Unassigned'}</small></td><td>{b.supplier_name||'—'}</td><td><a target="_blank" rel="noreferrer" href={`/api/warehouse/barcode?id=${b.product_id}`}>Print label</a></td></tr>)}</tbody></table></div>
        </div>

        <div className="warehouseSplit">
          <div className="warehousePanel"><h2>Open preorders</h2>{data.preorders.length?data.preorders.map(p=><div className="warehouseListRow" key={p.id}><div><b>{p.part_no}</b><span>{p.customer_name}</span></div><strong>{p.allocated_qty}/{p.quantity}</strong></div>):<p>No open preorders.</p>}</div>
          <div className="warehousePanel"><h2>Open returns & defects</h2>{data.returns.length?data.returns.map(r=><div className="warehouseListRow" key={r.id}><div><b>{r.return_no} · {r.part_no}</b><span>{r.reason}{r.defect_type?` — ${r.defect_type}`:''}</span></div><strong>{r.disposition}</strong></div>):<p>No open returns.</p>}</div>
        </div>
      </>}
    </div></section>
  </Layout>;
}
