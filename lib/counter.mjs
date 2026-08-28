import { createHash, randomUUID } from 'node:crypto';

export function normalizeItems(items) {
 if(!Array.isArray(items)||!items.length||items.length>100) throw new Error('Add between 1 and 100 sale lines.');
 const totals=new Map();
 for(const item of items){
  const id=Number(item.id),quantity=Number(item.quantity);
  if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(quantity)||quantity<1||quantity>100000) throw new Error('Part and quantity must be positive whole numbers.');
  totals.set(id,(totals.get(id)||0)+quantity);
  if(totals.get(id)>100000) throw new Error('Quantity is too large.');
 }
 return [...totals].sort((a,b)=>a[0]-b[0]).map(([id,quantity])=>({id,quantity}));
}

export async function requireCounterUser(client,userId) {
 const r=await client.query(`SELECT c.id,c.name,c.role,c.location_id,l.code,l.name location_name,l.active
 FROM customers c LEFT JOIN business_locations l ON l.id=c.location_id WHERE c.id=$1`,[userId]);
 const u=r.rows[0];
 if(!u||!['admin','general_manager','cashier'].includes(u.role)) throw new Error('Counter access denied.');
 if(!u.active||u.code!=='MAIN') throw new Error('An active Main Warehouse staff assignment is required. Branch counters are not enabled yet.');
 return u;
}

export async function assertStock(client,product,locationId,quantity){
 const unassigned=await client.query(`SELECT 1 FROM warehouse_order_items wi JOIN warehouse_orders wo ON wo.id=wi.warehouse_order_id WHERE wi.product_id=$1 AND wi.storage_area_id IS NULL AND wi.picked_qty<wi.quantity AND wo.status<>'CANCELLED' LIMIT 1`,[product.id]);
 if(unassigned.rowCount)throw new Error(`Stock reconciliation required for ${product.part_no}: a pending order has no storage area.`);
 const r=await client.query(`SELECT * FROM location_stock WHERE product_id=$1 AND location_id=$2`,[product.id,locationId]);
 const s=r.rows[0];
 if(!s||Number(s.reserved_qty)>Number(s.physical_qty)||Number(product.stock)!==Number(s.available_qty)) throw new Error(`Stock reconciliation required for ${product.part_no}. Ask the manager to check batch stock and pending orders.`);
 if(Number(s.available_qty)<quantity) throw new Error(`Insufficient available stock for ${product.part_no}. Available: ${s.available_qty}.`);
 return s;
}

export async function saleReceipt(client,saleId){
 const r=await client.query(`SELECT s.*,l.name location_name,c.name cashier_name FROM counter_sales s JOIN business_locations l ON l.id=s.location_id JOIN customers c ON c.id=s.cashier_id WHERE s.id=$1`,[saleId]);
 if(!r.rows[0]) return null;
 const items=await client.query(`SELECT part_no,name,quantity,unit_price_kes,line_total_kes FROM counter_sale_items WHERE sale_id=$1 ORDER BY id`,[saleId]);
 return {...r.rows[0],items:items.rows};
}

// Caller owns the transaction. Every stock-changing path locks products before batches.
export async function createCounterSale(client,user,body){
 user=await requireCounterUser(client,user.id);
 if(!['admin','cashier'].includes(user.role))throw new Error('This role cannot create sales. General manager access is read-only.');
 const items=normalizeItems(body.items);
 const requestKey=String(body.requestKey||'');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) throw new Error('A valid sale request key is required.');
 const method=body.paymentMethod;
 if(!['Cash','M-Pesa','Card'].includes(method)) throw new Error('Select Cash, M-Pesa or Card.');
 const reference=String(body.paymentReference||'').trim().toUpperCase();
 if(method!=='Cash'&&(!reference||reference.length>100)) throw new Error('Enter the confirmed payment reference (maximum 100 characters).');
 const customerName=String(body.customerName||'').trim()||'Walk-in customer';
 if(customerName.length>160) throw new Error('Customer name is too long.');
 const tendered=Number(body.tenderedKes);
 if(!Number.isSafeInteger(tendered)||tendered<1||tendered>2147483647) throw new Error('Enter a valid whole KSh amount received.');
 const expectedTotal=Number(body.expectedTotalKes);
 if(!Number.isSafeInteger(expectedTotal)||expectedTotal<1)throw new Error('A valid displayed sale total is required.');
 const hash=createHash('sha256').update(JSON.stringify({items,method,reference,customerName,tendered,expectedTotal})).digest('hex');
 // Same-key concurrent submissions serialize, including after a lost HTTP response.
 await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[requestKey]);
 const previous=await client.query('SELECT id,cashier_id,location_id,request_hash FROM counter_sales WHERE request_key=$1',[requestKey]);
 if(previous.rowCount){
  const p=previous.rows[0];
  if(String(p.cashier_id)!==String(user.id)||String(p.location_id)!==String(user.location_id)||p.request_hash!==hash) throw new Error('This request key was used for a different sale.');
  return saleReceipt(client,p.id);
 }
 const products=await client.query(`SELECT id,part_no,name,price_kes,stock FROM products WHERE id=ANY($1::bigint[]) AND active=TRUE ORDER BY id FOR UPDATE`,[items.map(i=>i.id)]);
 const byId=new Map(products.rows.map(p=>[Number(p.id),p]));
 let total=0;
 for(const item of items){
  const p=byId.get(item.id);if(!p)throw new Error('A selected part is no longer available.');
  await assertStock(client,p,user.location_id,item.quantity);
  total+=Number(p.price_kes)*item.quantity;
 }
 if(!Number.isSafeInteger(total)||total<1||total>2147483647) throw new Error('Sale total is outside the supported range.');
 if(total!==expectedTotal)throw new Error('A selling price changed. Refresh the counter and rebuild this sale before taking payment.');
 if(tendered<total||method!=='Cash'&&tendered!==total) throw new Error('Cash must cover the sale; electronic payment must match the total exactly.');
 const sale=await client.query(`INSERT INTO counter_sales(sale_no,request_key,request_hash,location_id,cashier_id,customer_name,payment_method,payment_reference,total_kes,tendered_kes,change_kes)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,['POS-'+randomUUID().toUpperCase(),requestKey,hash,user.location_id,user.id,customerName,method,method==='Cash'?null:reference,total,tendered,tendered-total]);
 const saleId=sale.rows[0].id;
 for(const item of items){
  const p=byId.get(item.id);
  const line=await client.query(`INSERT INTO counter_sale_items(sale_id,product_id,part_no,name,quantity,unit_price_kes,line_total_kes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[saleId,p.id,p.part_no,p.name,item.quantity,p.price_kes,item.quantity*Number(p.price_kes)]);
  const batches=await client.query(`SELECT b.* FROM inventory_batches b JOIN warehouses w ON w.id=b.warehouse_id WHERE b.product_id=$1 AND w.location_id=$2 AND w.active AND w.storage_type='BRAND' AND b.status='AVAILABLE' AND b.available_qty>0 ORDER BY b.received_at,b.id FOR UPDATE OF b`,[p.id,user.location_id]);
  let remaining=item.quantity;
  for(const batch of batches.rows){
   if(!remaining)break;const take=Math.min(remaining,Number(batch.available_qty));
   await client.query(`UPDATE inventory_batches SET available_qty=available_qty-$1,status=CASE WHEN available_qty=$1 THEN 'DEPLETED' ELSE status END WHERE id=$2`,[take,batch.id]);
   await client.query(`INSERT INTO counter_sale_allocations(sale_item_id,batch_id,quantity,unit_cost_kes) VALUES($1,$2,$3,$4)`,[line.rows[0].id,batch.id,take,batch.unit_cost_kes]);
   await client.query(`INSERT INTO inventory_movements(product_id,batch_id,warehouse_id,bin_id,movement_type,quantity,reference_type,reference_id,notes,created_by) VALUES($1,$2,$3,$4,'ISSUE',$5,'COUNTER_SALE',$6,'Warehouse counter sale',$7)`,[p.id,batch.id,batch.warehouse_id,batch.bin_id,-take,String(saleId),user.id]);
   remaining-=take;
  }
  if(remaining)throw new Error('Stock changed. Reload and retry.');
  await client.query('UPDATE products SET stock=stock-$1,updated_at=NOW() WHERE id=$2',[item.quantity,p.id]);
 }
 await client.query(`INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'COUNTER_SALE','counter_sale',$2,$3::jsonb)`,[user.id,String(saleId),JSON.stringify({locationId:user.location_id,total,method})]);
 return saleReceipt(client,saleId);
}
