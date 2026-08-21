import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const emptyReceipt={productId:'',warehouseId:'',quantity:'',batchNo:'',supplierName:'',supplierRef:'',binCode:'',unitCostKes:''};
const emptyNewPart={name:'',brand:'Jeep',category:'Engine',partNo:'',partType:'Aftermarket',priceKes:'',years:'',models:'',engine:'',imageUrl:''};
const emptyPreorder={productId:'',customerName:'',phone:'',email:'',quantity:'',expectedAt:'',notes:''};
const emptyReturn={productId:'',quantity:'',reason:'Factory defect',defectType:'',disposition:'QUARANTINE',notes:''};
const staffRoles=new Set(['admin','warehouse_manager','warehouse_clerk','picker','packer','dispatch','finance','auditor']);
const brands=['Jeep','Mercedes-Benz','Volkswagen','Range Rover','Volvo','Ford'];
const categories=['Engine','Brakes','Suspension','Electrical','Body','Interior','Cooling','Transmission','Filters','Steering','Other'];
const brandLogos={Jeep:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Jeep_logo.svg','Mercedes-Benz':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mercedes_benz_logo1989.png',Volkswagen:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Volkswagen_logo.png','Range Rover':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Land_Rover_logo_2.jpg',Volvo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Volvo-iron-mark-2021.jpg',Ford:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ford_Logo.png'};
const brandSlugs={Jeep:'jeep','Mercedes-Benz':'mercedes-benz',Volkswagen:'volkswagen','Range Rover':'range-rover',Volvo:'volvo',Ford:'ford'};
const brandFromSlug=slug=>Object.keys(brandSlugs).find(name=>brandSlugs[name]===String(slug||'').toLowerCase())||'';

export default function Warehouse(){
  const router=useRouter();
  const [auth,setAuth]=useState('checking');
  const [login,setLogin]=useState({email:'',password:''});
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [scan,setScan]=useState({});
  const [receiptMode,setReceiptMode]=useState('existing');
  const [receipt,setReceipt]=useState(emptyReceipt);
  const [newPart,setNewPart]=useState(emptyNewPart);
  const [preorder,setPreorder]=useState(emptyPreorder);
  const [ret,setRet]=useState(emptyReturn);
  const [activeBrand,setActiveBrand]=useState('');
  const [csvRows,setCsvRows]=useState([]);
  const [csvName,setCsvName]=useState('');
  const [importMessage,setImportMessage]=useState('');

  async function load(){setError('');try{const r=await fetch('/api/warehouse/overview',{cache:'no-store'});const j=await r.json();if(r.status===401||r.status===403){setAuth('login');setData(null);return;}if(!r.ok)throw new Error(j.error||'Could not load warehouse.');setData(j);setAuth('staff');}catch(e){setError(e.message);}}
  useEffect(()=>{(async()=>{try{const r=await fetch('/api/auth/me');const j=await r.json();if(r.ok&&staffRoles.has(j.user?.role)){setAuth('staff');await load();}else setAuth('login');}catch{setAuth('login');}})();},[]);
  useEffect(()=>{if(!router.isReady)return;const brand=brandFromSlug(router.query.brand);setActiveBrand(brand);if(brand)setNewPart(current=>({...current,brand}));},[router.isReady,router.query.brand]);

  async function staffLogin(e){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(login)});const j=await r.json();if(!r.ok)throw new Error(j.error||'Sign in failed.');if(!staffRoles.has(j.user?.role)){await fetch('/api/auth/logout',{method:'POST'});throw new Error('This account is not authorized for the warehouse portal.');}setAuth('staff');setLogin({email:'',password:''});await load();}catch(e2){setError(e2.message);}finally{setBusy(false);}}
  async function logout(){await fetch('/api/auth/logout',{method:'POST'});setData(null);setAuth('login');}

  const products=useMemo(()=>data?.products||[],[data]);
  const warehouses=data?.warehouses||[];
  const brandAreas=warehouses.filter(w=>w.storage_type==='BRAND');
  const selectedProduct=products.find(p=>String(p.id)===String(receipt.productId));
  const receivingBrand=receiptMode==='new'?newPart.brand:selectedProduct?.brand;
  const selectedArea=brandAreas.find(w=>w.brand_code===receivingBrand);
  const visibleProducts=activeBrand?products.filter(p=>p.brand===activeBrand):products;
  const visibleBatches=activeBrand?(data?.batches||[]).filter(b=>b.brand===activeBrand):(data?.batches||[]);
  const visibleOrders=activeBrand?(data?.warehouseOrders||[]).filter(o=>(o.items||[]).some(i=>i.brand===activeBrand)):(data?.warehouseOrders||[]);
  const visiblePreorders=activeBrand?(data?.preorders||[]).filter(p=>p.brand===activeBrand):(data?.preorders||[]);
  const visibleReturns=activeBrand?(data?.returns||[]).filter(r=>r.brand===activeBrand):(data?.returns||[]);
  const activeSummary=(data?.brandSummary||[]).find(area=>area.brand_code===activeBrand);
  function openBrand(brand){router.push(`/warehouse/${brandSlugs[brand]}`);}
  function openAllBrands(){router.push('/warehouse');}

  function parseCsv(text){
    const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim());
    if(lines.length<2) throw new Error('The CSV file has no part rows.');
    const split=line=>{const out=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(value.trim());value='';}else value+=c;}out.push(value.trim());return out;};
    const headers=split(lines[0]).map(h=>h.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));
    const required=['part_no','name','brand','category','price_kes','quantity','batch_no'];
    const missing=required.filter(h=>!headers.includes(h));
    if(missing.length) throw new Error(`Missing CSV columns: ${missing.join(', ')}`);
    return lines.slice(1).map((line,index)=>{const values=split(line);const row={};headers.forEach((h,i)=>row[h]=values[i]||'');row._row=index+2;return row;});
  }
  async function chooseCsv(e){setError('');setImportMessage('');const file=e.target.files?.[0];if(!file)return;try{const rows=parseCsv(await file.text());setCsvRows(rows);setCsvName(file.name);setImportMessage(`${rows.length} part row${rows.length===1?'':'s'} ready to import.`);}catch(err){setCsvRows([]);setCsvName('');setError(err.message);}}
  async function importCsv(){setBusy(true);setError('');setImportMessage('');try{const r=await fetch('/api/warehouse/import-csv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:csvRows})});const j=await r.json();if(!r.ok)throw new Error(j.error||'CSV import failed.');setImportMessage(`${j.imported} rows imported successfully. ${j.createdProducts} new parts created and published online.`);setCsvRows([]);setCsvName('');await load();}catch(err){setError(err.message);}finally{setBusy(false);}}

  async function send(url,body,reset){setBusy(true);setError('');try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j.error||'Action failed.');if(reset)reset();await load();}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function processOrder(jobId,action,itemId=null){const body={jobId,action};if(itemId){body.itemId=itemId;body.barcode=scan[itemId]||'';}await send('/api/warehouse/orders/process',body,()=>{if(itemId)setScan(s=>({...s,[itemId]:''}));});}
  function selectReceiptProduct(value){const p=products.find(x=>String(x.id)===String(value));const area=brandAreas.find(w=>w.brand_code===p?.brand);setReceipt({...receipt,productId:value,warehouseId:area?String(area.id):''});}
  function setNewPartBrand(brand){const area=brandAreas.find(w=>w.brand_code===brand);setNewPart({...newPart,brand});setReceipt({...receipt,warehouseId:area?String(area.id):''});}
  function changeReceiptMode(mode){setReceiptMode(mode);setReceipt({...emptyReceipt,warehouseId:mode==='new'?(brandAreas.find(w=>w.brand_code===newPart.brand)?.id?.toString()||''):''});}
  function submitReceipt(e){
    e.preventDefault();
    const payload={...receipt,createNew:receiptMode==='new',productId:receiptMode==='existing'?Number(receipt.productId):null,warehouseId:Number(receipt.warehouseId),quantity:Number(receipt.quantity),unitCostKes:receipt.unitCostKes===''?null:Number(receipt.unitCostKes),newPart:receiptMode==='new'?{...newPart,priceKes:Number(newPart.priceKes)}:undefined};
    send('/api/warehouse/receive',payload,()=>{setReceipt(emptyReceipt);setNewPart(emptyNewPart);setReceiptMode('existing');});
  }

  if(auth==='checking') return <Layout><section className="warehouseLoginPage"><div className="warehouseLoginLoading">Loading secure warehouse portal…</div></section></Layout>;
  if(auth==='login') return <Layout><section className="warehouseLoginPage"><div className="warehouseLoginShell"><div className="warehouseLoginBrand"><div className="warehouseCompanyMark">S</div><div><h1>SHILATECH</h1><span>AUTO SPARES · WAREHOUSE PORTAL</span></div></div><div className="warehouseLoginSelect"><b>Select a vehicle warehouse</b><span>Choose a logo to open that brand's dedicated page, then sign in.</span></div><div className="warehouseLoginLogos">{Object.entries(brandLogos).map(([name,src])=><button type="button" className={activeBrand===name?'selected':''} key={name} onClick={()=>openBrand(name)} aria-pressed={activeBrand===name}><img src={src} alt={`${name} logo`}/><span>{name}</span><small>{activeBrand===name?'SELECTED':'OPEN'}</small></button>)}</div><form className="warehouseLoginCard" onSubmit={staffLogin}><span className="eyebrow">EMPLOYEE ACCESS ONLY</span><h2>{activeBrand?`${activeBrand} Warehouse Login`:'Warehouse Staff Login'}</h2><p>{activeBrand?`Sign in to open the ${activeBrand} parts warehouse.`:'Sign in with your authorized Shilatech employee account.'}</p>{error&&<div className="warehouseAlert">{error}</div>}<label>Email<input type="email" required autoComplete="username" value={login.email} onChange={e=>setLogin({...login,email:e.target.value})}/></label><label>Password<input type="password" required autoComplete="current-password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/></label><button className="button greenPrimary" disabled={busy}>{busy?'Signing in…':activeBrand?`Open ${activeBrand} warehouse`:'Sign in to warehouse'}</button><small>Customer accounts cannot access warehouse information.</small></form></div></section></Layout>;

  return <Layout>
    <section className="pageHero compactHero"><div className="container warehouseHeroRow"><div><span className="eyebrow">PRIVATE STAFF PORTAL</span><h1>{activeBrand?`${activeBrand} Warehouse`:'Warehouse & 3PL Operations'}</h1><p>{activeBrand?`Dedicated ${activeBrand} parts, FIFO inventory, receiving, preorders and returns.`:'Customer orders, FIFO inventory, brand-separated storage, barcodes, preorders and returns.'}</p></div><button className="warehouseLogout" onClick={logout}>Sign out</button></div></section>
    <section className="section warehousePage"><div className="container">
      {error&&<div className="warehouseAlert">{error}</div>}
      {!data&&!error&&<p>Loading warehouse…</p>}
      {data&&<>
        <div className="warehouseMetrics"><div><span>Units on hand</span><strong>{activeBrand?activeSummary?.units_on_hand||0:data.metrics.units_on_hand}</strong></div><div><span>Active FIFO batches</span><strong>{activeBrand?activeSummary?.active_batches||0:data.metrics.active_batches}</strong></div><div><span>Online orders waiting</span><strong>{visibleOrders.length}</strong></div><div><span>Open preorders</span><strong>{visiblePreorders.length}</strong></div></div>

        <div className="warehousePanel warehouseOrderQueue"><div className="warehousePanelHead"><div><span className="eyebrow">ONLINE SALES → WAREHOUSE</span><h2>Customer order fulfilment queue</h2><p>Process every website order from picking through dispatch. Barcode scans are checked before FIFO stock is issued.</p></div></div>
          {visibleOrders.length?<div className="warehouseOrderGrid">{visibleOrders.map(o=><div className="warehouseOrderCard" key={o.id}>
            <div className="warehouseOrderTop"><div><b>{o.job_no}</b><span>Order {o.order_no}</span></div><strong>{o.status}</strong></div>
            <div className="warehouseCustomer"><b>{o.customer_name}</b><span>{o.phone} · {o.delivery_zone}</span><span>{o.payment_method} · {o.payment_status}</span></div>
            <div className="warehouseOrderItems">{(o.items||[]).filter(i=>!activeBrand||i.brand===activeBrand).map(i=><div key={i.id} className="warehousePickRow"><div><b>{i.brand} · {i.partNo}</b><span>{i.name}</span><small>{i.storageArea||'Storage area pending'}</small></div><div className="warehousePickControl"><strong>{i.pickedQty}/{i.quantity}</strong>{o.status==='PICKING'&&i.status!=='PICKED'&&<><input aria-label={`Scan barcode for ${i.partNo}`} placeholder="Scan barcode / part no." value={scan[i.id]||''} onChange={e=>setScan({...scan,[i.id]:e.target.value})} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();processOrder(o.id,'PICK_ITEM',i.id);}}}/><button disabled={busy||!(scan[i.id]||'').trim()} onClick={()=>processOrder(o.id,'PICK_ITEM',i.id)}>Scan & pick</button></>}</div></div>)}</div>
            <div className="warehouseFlow"><span className={['PICKING','PICKED','PACKING','READY_DISPATCH'].includes(o.status)?'done':''}>Picking</span><span className={['PICKED','PACKING','READY_DISPATCH'].includes(o.status)?'done':''}>Picked</span><span className={['PACKING','READY_DISPATCH'].includes(o.status)?'done':''}>Packing</span><span className={o.status==='READY_DISPATCH'?'done':''}>Dispatch ready</span></div>
            <div className="warehouseOrderActions">{o.status==='NEW'&&<button disabled={busy} onClick={()=>processOrder(o.id,'START_PICKING')}>Start picking</button>}{o.status==='PICKED'&&<button disabled={busy} onClick={()=>processOrder(o.id,'START_PACKING')}>Start packing</button>}{o.status==='PACKING'&&<button disabled={busy} onClick={()=>processOrder(o.id,'READY_DISPATCH')}>Ready for dispatch</button>}{o.status==='READY_DISPATCH'&&<button disabled={busy} onClick={()=>processOrder(o.id,'DISPATCH')}>Mark dispatched</button>}</div>
          </div>)}</div>:<div className="emptyWarehouseOrders">No online orders waiting for warehouse processing.</div>}
        </div>

        <div className="brandStorageHead"><div><span className="eyebrow">DEDICATED STORAGE</span><h2>Separate storage area for every vehicle brand</h2><p>Parts are automatically assigned to the correct brand zone.</p></div></div>
        <div className="brandStorageGrid">{(data.brandSummary||[]).map(area=><button type="button" className={`brandStorageCard brandStorageButton${activeBrand===area.brand_code?' active':''}`} key={area.id} onClick={()=>openBrand(area.brand_code)} aria-pressed={activeBrand===area.brand_code}><div className="brandStorageLogo">{brandLogos[area.brand_code]?<img src={brandLogos[area.brand_code]} alt={`${area.brand_code} logo`}/>:<strong>{area.brand_code}</strong>}</div><div className="brandStorageBody"><span>{area.code} ZONE</span><h3>{area.name}</h3><p>{area.units_on_hand} units · {area.active_batches} active FIFO batches</p><small>{activeBrand===area.brand_code?'CURRENT WAREHOUSE':'OPEN DEDICATED PAGE →'}</small></div></button>)}</div>
        {activeBrand&&<div className="storageAssignment"><b>{activeBrand} warehouse</b><span>This page contains only {activeBrand} operations and inventory.</span><button type="button" onClick={openAllBrands}>← Back to all warehouses</button></div>}
        <div className="quarantineNotice"><strong>⚠ Returns & Defect Quarantine</strong><span>Factory-defect and non-sellable parts remain separated from sellable stock.</span></div>

        <div className="warehousePanel warehouseWide csvImportPanel"><div className="warehousePanelHead"><div><span className="eyebrow">BULK RECEIVING</span><h2>Upload parts from CSV</h2><p>Import many parts at once. Every row is assigned to its matching brand warehouse and FIFO batch.</p></div><a className="button" download="shilatech-parts-import-template.csv" href={'data:text/csv;charset=utf-8,'+encodeURIComponent('part_no,name,brand,category,part_type,price_kes,quantity,batch_no,bin_code,supplier_name,supplier_ref,unit_cost_kes,models,years,engine,image_url\nTEST-JEEP-002,Jeep Brake Pad Set,Jeep,Brakes,Aftermarket,8500,10,GRN-TEST-002,JEEP-B-01-01,Test Supplier,TS-002,5000,"Grand Cherokee,Wrangler",2014-2022,3.0 / 3.6,')}>Download CSV template</a></div><div className="csvImportControls"><label>Select completed CSV file<input type="file" accept=".csv,text/csv" onChange={chooseCsv}/></label>{csvName&&<span><b>{csvName}</b> · {csvRows.length} rows</span>}<button type="button" className="button greenPrimary" disabled={busy||!csvRows.length} onClick={importCsv}>{busy?'Importing…':`Import ${csvRows.length||''} rows`}</button></div>{importMessage&&<div className="onlinePublishNotice"><b>✓ CSV status</b><span>{importMessage}</span></div>}</div>

        <div className="warehouseForms">
          <form className="warehousePanel" onSubmit={submitReceipt}>
            <h2>Receive stock</h2><p>Receive an existing part or create a brand-new catalog item and publish it online immediately.</p>
            <div className="receiptModeSwitch"><button type="button" className={receiptMode==='existing'?'active':''} onClick={()=>changeReceiptMode('existing')}>Existing part</button><button type="button" className={receiptMode==='new'?'active':''} onClick={()=>changeReceiptMode('new')}>+ Create new part</button></div>
            {receiptMode==='existing'?<label>Part<select required value={receipt.productId} onChange={e=>selectReceiptProduct(e.target.value)}><option value="">Select part</option>{visibleProducts.map(p=><option value={p.id} key={p.id}>{p.brand} · {p.part_no} — {p.name}</option>)}</select></label>:<div className="newPartFields">
              <div className="onlinePublishNotice"><b>✓ Publish online automatically</b><span>This part will appear in the website catalog as soon as this receipt is saved.</span></div>
              <label>Vehicle brand<select required value={newPart.brand} onChange={e=>setNewPartBrand(e.target.value)}>{(activeBrand?[activeBrand]:brands).map(b=><option key={b}>{b}</option>)}</select></label>
              <label>Part number / SKU<input required value={newPart.partNo} onChange={e=>setNewPart({...newPart,partNo:e.target.value.toUpperCase()})} placeholder="e.g. A2711800109"/></label>
              <label>Part name<input required value={newPart.name} onChange={e=>setNewPart({...newPart,name:e.target.value})} placeholder="e.g. Oil Filter"/></label>
              <label>Category<select required value={newPart.category} onChange={e=>setNewPart({...newPart,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
              <label>OEM / Aftermarket<select value={newPart.partType} onChange={e=>setNewPart({...newPart,partType:e.target.value})}><option>Aftermarket</option><option>OEM</option><option>Genuine</option></select></label>
              <label>Selling price (KSh)<input required type="number" min="0" value={newPart.priceKes} onChange={e=>setNewPart({...newPart,priceKes:e.target.value})}/></label>
              <label>Compatible models<input value={newPart.models} onChange={e=>setNewPart({...newPart,models:e.target.value})} placeholder="Grand Cherokee, Wrangler"/></label>
              <label>Years<input value={newPart.years} onChange={e=>setNewPart({...newPart,years:e.target.value})} placeholder="2014–2021"/></label>
              <label>Engine<input value={newPart.engine} onChange={e=>setNewPart({...newPart,engine:e.target.value})} placeholder="3.0 / 3.6"/></label>
              <label>Product image URL<input type="url" value={newPart.imageUrl} onChange={e=>setNewPart({...newPart,imageUrl:e.target.value})} placeholder="https://..."/></label>
            </div>}
            <label>Dedicated storage area<select required value={receipt.warehouseId} onChange={e=>setReceipt({...receipt,warehouseId:e.target.value})}><option value="">Select storage area</option>{brandAreas.map(w=><option value={w.id} key={w.id} disabled={receivingBrand&&w.brand_code!==receivingBrand}>{w.code} — {w.name}</option>)}</select></label>
            {receivingBrand&&<div className="storageAssignment"><b>{receivingBrand}</b><span>→ {selectedArea?.name||'No matching area configured'}</span></div>}
            <label>Quantity<input required type="number" min="1" value={receipt.quantity} onChange={e=>setReceipt({...receipt,quantity:e.target.value})}/></label>
            <label>Batch / GRN number<input required value={receipt.batchNo} onChange={e=>setReceipt({...receipt,batchNo:e.target.value})}/></label>
            <label>Bin code<input placeholder="e.g. JEEP-A-01-02" value={receipt.binCode} onChange={e=>setReceipt({...receipt,binCode:e.target.value})}/></label>
            <label>Supplier<input value={receipt.supplierName} onChange={e=>setReceipt({...receipt,supplierName:e.target.value})}/></label>
            <label>Supplier reference<input value={receipt.supplierRef} onChange={e=>setReceipt({...receipt,supplierRef:e.target.value})}/></label>
            <label>Unit cost (KSh)<input type="number" min="0" value={receipt.unitCostKes} onChange={e=>setReceipt({...receipt,unitCostKes:e.target.value})}/></label>
            <button disabled={busy} className="button greenPrimary">{busy?'Saving…':receiptMode==='new'?'Create part, receive & publish':'Receive into brand area'}</button>
          </form>

          <form className="warehousePanel" onSubmit={e=>{e.preventDefault();send('/api/warehouse/preorders',{...preorder,productId:Number(preorder.productId),quantity:Number(preorder.quantity)},()=>setPreorder(emptyPreorder));}}><h2>Create preorder</h2><p>Records demand for stock not yet available.</p><label>Part<select required value={preorder.productId} onChange={e=>setPreorder({...preorder,productId:e.target.value})}><option value="">Select part</option>{visibleProducts.map(p=><option value={p.id} key={p.id}>{p.brand} · {p.part_no} — {p.name}</option>)}</select></label><label>Customer name<input required value={preorder.customerName} onChange={e=>setPreorder({...preorder,customerName:e.target.value})}/></label><label>Phone<input value={preorder.phone} onChange={e=>setPreorder({...preorder,phone:e.target.value})}/></label><label>Email<input type="email" value={preorder.email} onChange={e=>setPreorder({...preorder,email:e.target.value})}/></label><label>Quantity<input required type="number" min="1" value={preorder.quantity} onChange={e=>setPreorder({...preorder,quantity:e.target.value})}/></label><label>Expected date<input type="date" value={preorder.expectedAt} onChange={e=>setPreorder({...preorder,expectedAt:e.target.value})}/></label><label>Notes<textarea rows="3" value={preorder.notes} onChange={e=>setPreorder({...preorder,notes:e.target.value})}/></label><button disabled={busy} className="button greenPrimary">Save preorder</button></form>
          <form className="warehousePanel" onSubmit={e=>{e.preventDefault();send('/api/warehouse/returns',{...ret,productId:Number(ret.productId),quantity:Number(ret.quantity)},()=>setRet(emptyReturn));}}><h2>Return / factory defect</h2><p>Defective parts go to quarantine.</p><label>Part<select required value={ret.productId} onChange={e=>setRet({...ret,productId:e.target.value})}><option value="">Select part</option>{visibleProducts.map(p=><option value={p.id} key={p.id}>{p.brand} · {p.part_no} — {p.name}</option>)}</select></label><label>Quantity<input required type="number" min="1" value={ret.quantity} onChange={e=>setRet({...ret,quantity:e.target.value})}/></label><label>Reason<select value={ret.reason} onChange={e=>setRet({...ret,reason:e.target.value})}><option>Factory defect</option><option>Customer return</option><option>Wrong part</option><option>Transit damage</option><option>Warranty issue</option></select></label><label>Defect type<input value={ret.defectType} onChange={e=>setRet({...ret,defectType:e.target.value})}/></label><label>Disposition<select value={ret.disposition} onChange={e=>setRet({...ret,disposition:e.target.value})}><option>QUARANTINE</option><option>SUPPLIER_RETURN</option><option>REPAIR</option><option>WRITE_OFF</option></select></label><label>Notes<textarea rows="3" value={ret.notes} onChange={e=>setRet({...ret,notes:e.target.value})}/></label><button disabled={busy} className="button greenPrimary">Record return</button></form>
        </div>

        <div className="warehousePanel warehouseWide"><div className="warehousePanelHead"><div><h2>{activeBrand?`${activeBrand} FIFO stock batches`:'FIFO stock batches'}</h2><p>Oldest available stock is used first.</p></div></div><div className="warehouseTableWrap"><table className="warehouseTable"><thead><tr><th>Brand</th><th>Part</th><th>Batch</th><th>Received</th><th>Available</th><th>Storage area / Bin</th><th>Supplier</th><th>Barcode</th></tr></thead><tbody>{visibleBatches.map(b=><tr key={b.id}><td><b>{b.brand}</b><small>{b.warehouse_code}</small></td><td><b>{b.part_no}</b><small>{b.name}</small></td><td>{b.batch_no}</td><td>{new Date(b.received_at).toLocaleDateString()}</td><td>{b.available_qty}/{b.received_qty}</td><td>{b.warehouse}<small>{b.bin_code||'Unassigned'}</small></td><td>{b.supplier_name||'—'}</td><td><a target="_blank" rel="noreferrer" href={`/api/warehouse/barcode?id=${b.product_id}`}>Print label</a></td></tr>)}</tbody></table>{!visibleBatches.length&&<p>No FIFO batches found for this warehouse.</p>}</div></div>
        <div className="warehouseSplit"><div className="warehousePanel"><h2>Open preorders</h2>{visiblePreorders.length?visiblePreorders.map(p=><div className="warehouseListRow" key={p.id}><div><b>{p.part_no}</b><span>{p.customer_name}</span></div><strong>{p.allocated_qty}/{p.quantity}</strong></div>):<p>No open preorders.</p>}</div><div className="warehousePanel"><h2>Open returns & defects</h2>{visibleReturns.length?visibleReturns.map(r=><div className="warehouseListRow" key={r.id}><div><b>{r.return_no} · {r.brand} · {r.part_no}</b><span>{r.reason}{r.defect_type?` — ${r.defect_type}`:''}</span></div><strong>{r.disposition}</strong></div>):<p>No open returns.</p>}</div></div>
      </>}
    </div></section>
  </Layout>;
}
