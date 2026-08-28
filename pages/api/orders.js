import { query, getPool } from '../../lib/db';
import { readSession } from '../../lib/auth';
import { normalizeItems,assertStock } from '../../lib/counter.mjs';

function makeOrderNo(){const stamp=new Date().toISOString().slice(0,10).replaceAll('-','');return `SHI-${stamp}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;}
function makeJobNo(orderNo){return `WH-${orderNo}`;}

async function calculateShipping(client,{deliveryServiceCode,destinationCountry,subtotal}){
  const country=String(destinationCountry||'Kenya').trim()||'Kenya';
  if(country.toLowerCase()!=='kenya'){
    const shipping=Math.max(4500,Math.round(subtotal*0.08));
    const taxProvision=Math.round(subtotal*0.20);
    return {code:'INTL_EST',name:'International Shipping — Estimate',zone:'International',country,delivery:shipping,taxProvision,dutyProvision:0,eta:'Estimated 5–10 business days after dispatch'};
  }
  const code=String(deliveryServiceCode||'LOCAL_NEXT');
  const q=await client.query(`SELECT code,name,hours,base_cost_kes FROM delivery_services WHERE code=$1 AND scope='LOCAL' AND active=TRUE`,[code]);
  if(!q.rowCount) throw new Error('Selected delivery service is unavailable.');
  const s=q.rows[0];
  return {code:s.code,name:s.name,zone:'Nairobi',country:'Kenya',delivery:Number(s.base_cost_kes),taxProvision:0,dutyProvision:0,eta:Number(s.hours)===24?'Next business day':`Within ${s.hours} hours`};
}

export default async function handler(req,res){
  const session=await readSession(req);
  if(req.method==='POST'&&session&&session.role!=='customer')return res.status(403).json({error:'Staff must use their authorised department workflow. Customer checkout is for customer accounts.'});
  if(req.method==='GET'){
    if(!session)return res.status(401).json({error:'Sign in required.'});
    try{const result=await query(`SELECT id,order_no AS "orderNo",customer_name AS "customerName",total_kes AS total,payment_method AS "paymentMethod",payment_status AS "paymentStatus",status,delivery_service_code AS "deliveryServiceCode",delivery_eta AS "deliveryEta",destination_country AS "destinationCountry",created_at AS "createdAt" FROM orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100`,[session.sub]);return res.status(200).json({orders:result.rows});}
    catch(error){console.error(error);return res.status(500).json({error:'Could not load orders.'});}
  }
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});

  const {customerName,email,phone,deliveryAddress,paymentMethod='M-Pesa',items,deliveryServiceCode='LOCAL_NEXT',destinationCountry='Kenya'}=req.body||{};
  if(!customerName||!email||!phone||!deliveryAddress||!Array.isArray(items)||!items.length)return res.status(400).json({error:'Customer, delivery and cart details are required.'});
  let normalized;
  try{normalized=normalizeItems(items);}catch(e){return res.status(400).json({error:e.message});}
  if(!normalized.length)return res.status(400).json({error:'Cart is empty.'});

  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const ids=normalized.map(i=>i.id);
    const location=await client.query(`SELECT id FROM business_locations WHERE code='MAIN' AND active=TRUE`);
    if(!location.rowCount)throw new Error('Main warehouse is unavailable.');
    const locationId=location.rows[0].id;
    const productResult=await client.query(`SELECT id,name,brand,part_no,price_kes,stock FROM products WHERE id=ANY($1::bigint[]) AND active=TRUE ORDER BY id FOR UPDATE`,[ids]);
    for(const item of normalized){const p=productResult.rows.find(p=>Number(p.id)===item.id);if(p)await assertStock(client,p,locationId,item.quantity);}
    const byId=new Map(productResult.rows.map(p=>[Number(p.id),p]));
    let subtotal=0;const lines=[];
    for(const item of normalized){const p=byId.get(item.id);if(!p)throw new Error(`Product ${item.id} is unavailable`);if(Number(p.stock)<item.quantity)throw new Error(`Insufficient stock for ${p.name}`);const lineTotal=Number(p.price_kes)*item.quantity;subtotal+=lineTotal;lines.push({...p,quantity:item.quantity,lineTotal});}
    const ship=await calculateShipping(client,{deliveryServiceCode,destinationCountry,subtotal});
    const total=subtotal+ship.delivery+ship.taxProvision+ship.dutyProvision;const orderNo=makeOrderNo();
    const orderResult=await client.query(`INSERT INTO orders (order_no,customer_id,customer_name,email,phone,delivery_address,delivery_zone,subtotal_kes,delivery_kes,total_kes,payment_method,delivery_service_code,delivery_eta,destination_country,shipping_tax_kes,shipping_duty_kes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,[orderNo,session?.sub||null,String(customerName).trim(),String(email).trim().toLowerCase(),String(phone).trim(),String(deliveryAddress).trim(),ship.zone,subtotal,ship.delivery,total,paymentMethod,ship.code,ship.eta,ship.country,ship.taxProvision,ship.dutyProvision]);
    const orderId=orderResult.rows[0].id;
    await client.query('UPDATE orders SET location_id=$1 WHERE id=$2',[locationId,orderId]);
    const job=await client.query(`INSERT INTO warehouse_orders (order_id,job_no,status) VALUES ($1,$2,'NEW') RETURNING id,job_no`,[orderId,makeJobNo(orderNo)]);const warehouseOrderId=job.rows[0].id;
    for(const line of lines){const oi=await client.query(`INSERT INTO order_items (order_id,product_id,part_no,name,quantity,unit_price_kes,line_total_kes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[orderId,line.id,line.part_no,line.name,line.quantity,line.price_kes,line.lineTotal]);const area=await client.query(`SELECT id FROM warehouses WHERE active=TRUE AND storage_type='BRAND' AND brand_code=$1 LIMIT 1`,[line.brand]);await client.query(`INSERT INTO warehouse_order_items (warehouse_order_id,order_item_id,product_id,storage_area_id,brand,part_no,name,quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[warehouseOrderId,oi.rows[0].id,line.id,area.rows[0]?.id||null,line.brand,line.part_no,line.name,line.quantity]);await client.query(`UPDATE products SET stock=stock-$1,updated_at=NOW() WHERE id=$2`,[line.quantity,line.id]);}
    await client.query(`INSERT INTO warehouse_audit (action,entity_type,entity_id,details) VALUES ('CUSTOMER_ORDER_RECEIVED','warehouse_order',$1,$2::jsonb)`,[String(warehouseOrderId),JSON.stringify({orderNo,jobNo:job.rows[0].job_no,customerName,deliveryService:ship.name,destinationCountry:ship.country})]);
    await client.query('COMMIT');
    return res.status(201).json({order:{orderNo,warehouseJobNo:job.rows[0].job_no,subtotal,delivery:ship.delivery,shippingTaxProvision:ship.taxProvision,shippingDutyProvision:ship.dutyProvision,total,paymentMethod,paymentStatus:'Pending',status:'Pending',deliveryService:ship.name,deliveryEta:ship.eta,destinationCountry:ship.country}});
  }catch(error){await client.query('ROLLBACK');console.error(error);return res.status(400).json({error:error.message||'Could not create order.'});}
  finally{client.release();}
}
