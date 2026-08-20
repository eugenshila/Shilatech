import { query, getPool } from '../../lib/db';
import { readSession } from '../../lib/auth';

function makeOrderNo() {
  const stamp = new Date().toISOString().slice(0,10).replaceAll('-','');
  return `SHI-${stamp}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}
function makeJobNo(orderNo) { return `WH-${orderNo}`; }

const deliveryPrices = { Nairobi:500, 'Greater Nairobi':800, Regional:1200, National:1500 };

export default async function handler(req, res) {
  const session = readSession(req);
  if (req.method === 'GET') {
    if (!session) return res.status(401).json({ error: 'Sign in required.' });
    try {
      const result = await query(`SELECT id,order_no AS "orderNo",customer_name AS "customerName",total_kes AS total,
        payment_method AS "paymentMethod",payment_status AS "paymentStatus",status,created_at AS "createdAt"
        FROM orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100`, [session.sub]);
      return res.status(200).json({ orders: result.rows });
    } catch (error) { console.error(error); return res.status(500).json({ error: 'Could not load orders.' }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customerName,email,phone,deliveryAddress,deliveryZone='Nairobi',paymentMethod='M-Pesa',items } = req.body || {};
  if (!customerName || !email || !phone || !deliveryAddress || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'Customer, delivery and cart details are required.' });

  const normalized=items.map(i=>({id:Number(i.id),quantity:Math.max(1,Number(i.quantity||1))})).filter(i=>Number.isInteger(i.id));
  if(!normalized.length) return res.status(400).json({error:'Cart is empty.'});

  const client=await getPool().connect();
  try {
    await client.query('BEGIN');
    const ids=normalized.map(i=>i.id);
    const productResult=await client.query(`SELECT id,name,brand,part_no,price_kes,stock FROM products WHERE id=ANY($1::bigint[]) AND active=TRUE FOR UPDATE`,[ids]);
    const byId=new Map(productResult.rows.map(p=>[Number(p.id),p]));
    let subtotal=0; const lines=[];
    for(const item of normalized){
      const p=byId.get(item.id); if(!p) throw new Error(`Product ${item.id} is unavailable`);
      if(Number(p.stock)<item.quantity) throw new Error(`Insufficient stock for ${p.name}`);
      const lineTotal=Number(p.price_kes)*item.quantity; subtotal+=lineTotal; lines.push({...p,quantity:item.quantity,lineTotal});
    }
    const delivery=deliveryPrices[deliveryZone]??deliveryPrices.National; const total=subtotal+delivery; const orderNo=makeOrderNo();
    const orderResult=await client.query(`INSERT INTO orders (order_no,customer_id,customer_name,email,phone,delivery_address,delivery_zone,subtotal_kes,delivery_kes,total_kes,payment_method)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,[orderNo,session?.sub||null,String(customerName).trim(),String(email).trim().toLowerCase(),String(phone).trim(),String(deliveryAddress).trim(),deliveryZone,subtotal,delivery,total,paymentMethod]);
    const orderId=orderResult.rows[0].id;
    const job=await client.query(`INSERT INTO warehouse_orders (order_id,job_no,status) VALUES ($1,$2,'NEW') RETURNING id,job_no`,[orderId,makeJobNo(orderNo)]);
    const warehouseOrderId=job.rows[0].id;

    for(const line of lines){
      const oi=await client.query(`INSERT INTO order_items (order_id,product_id,part_no,name,quantity,unit_price_kes,line_total_kes)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[orderId,line.id,line.part_no,line.name,line.quantity,line.price_kes,line.lineTotal]);
      const area=await client.query(`SELECT id FROM warehouses WHERE active=TRUE AND storage_type='BRAND' AND brand_code=$1 LIMIT 1`,[line.brand]);
      await client.query(`INSERT INTO warehouse_order_items (warehouse_order_id,order_item_id,product_id,storage_area_id,brand,part_no,name,quantity)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[warehouseOrderId,oi.rows[0].id,line.id,area.rows[0]?.id||null,line.brand,line.part_no,line.name,line.quantity]);
      await client.query(`UPDATE products SET stock=stock-$1,updated_at=NOW() WHERE id=$2`,[line.quantity,line.id]);
    }
    await client.query(`INSERT INTO warehouse_audit (action,entity_type,entity_id,details) VALUES ('CUSTOMER_ORDER_RECEIVED','warehouse_order',$1,$2::jsonb)`,[String(warehouseOrderId),JSON.stringify({orderNo,jobNo:job.rows[0].job_no,customerName,deliveryZone})]);
    await client.query('COMMIT');
    return res.status(201).json({order:{orderNo,warehouseJobNo:job.rows[0].job_no,subtotal,delivery,total,paymentMethod,paymentStatus:'Pending',status:'Pending'}});
  } catch(error){await client.query('ROLLBACK');console.error(error);return res.status(400).json({error:error.message||'Could not create order.'});}
  finally{client.release();}
}
