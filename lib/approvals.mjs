import { staffPages } from './staff-access.mjs';
import { assertStock } from './counter.mjs';
import { cancelUnpickedOrder } from './cancel-order.mjs';

const whole=(value,label,min=1)=>{const n=Number(value);if(value==null||value===''||!Number.isSafeInteger(n)||n<min||n>2147483647)throw new Error(`${label} must be a whole number of at least ${min}.`);return n;};
const text=(v,label,max=1000)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new Error(`${label} is required (maximum ${max} characters).`);return v.trim();};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const approvalKinds=['PRICE_CHANGE','STOCK_ADJUSTMENT','REFUND','SALE_CORRECTION','ORDER_CORRECTION','GARAGE_CORRECTION'];
export function allowedRequestKinds(role){
 if(['admin','general_manager'].includes(role))return approvalKinds;
 if(role==='cashier')return ['PRICE_CHANGE','REFUND','SALE_CORRECTION'];
 if(role==='garage_staff')return ['GARAGE_CORRECTION'];
 if(staffPages(role).includes('/warehouse'))return ['STOCK_ADJUSTMENT'];
 return [];
}
export async function audit(client,user,action,id,details,type='staff_request'){
 await client.query(`INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5::jsonb)`,[user.id||user.sub,action,type,String(id),JSON.stringify(details)]);
}
export async function currentActor(client,id){
 const r=await client.query('SELECT id,role,location_id FROM customers WHERE id=$1 FOR SHARE',[id]);
 if(!r.rows[0]||!staffPages(r.rows[0].role).length)throw new Error('Staff access denied.');
 return r.rows[0];
}
export function normalizeProposal(kind,body={}){
 if(kind==='PRICE_CHANGE')return {priceKes:whole(body.priceKes,'Price',0)};
 if(kind==='STOCK_ADJUSTMENT')return {quantity:whole(body.quantity,'Counted available batch quantity',0)};
 if(kind==='REFUND'){
  if(!['POS','ONLINE'].includes(body.source))throw new Error('Choose POS or ONLINE.');
  return {source:body.source,amountKes:whole(body.amountKes,'Refund amount')};
 }
 if(kind==='SALE_CORRECTION'){
  if(!['customer_name','payment_reference'].includes(body.field))throw new Error('Choose customer_name or payment_reference.');
  return {field:body.field,value:text(body.value,'Corrected value',body.field==='customer_name'?160:100)};
 }
 if(kind==='ORDER_CORRECTION'){
  const status=body.status||null,paymentStatus=body.paymentStatus||null;
  if(!status&&!paymentStatus||status&&!['Pending','Processing','Shipped','Out for Delivery','Delivered','Cancelled'].includes(status)||paymentStatus&&!['Pending','Paid','Completed','Failed'].includes(paymentStatus))throw new Error('Choose a valid order status or payment status. Use a refund request for refunds.');
  return {status,paymentStatus};
 }
 if(kind==='GARAGE_CORRECTION'){
  if(!['customer_name','phone','vehicle','registration','service','status'].includes(body.field))throw new Error('Invalid garage correction field.');
  const value=text(body.value,'Corrected value',200);
  if(body.field==='status'&&!['BOOKED','INSPECTION','AWAITING_CUSTOMER','IN_PROGRESS','READY','COMPLETED','CANCELLED'].includes(value))throw new Error('Invalid garage status.');
  return {field:body.field,value};
 }
 throw new Error('Unsupported request.');
}
async function snapshot(c,kind,id,p,user){
 let r;
 if(kind==='PRICE_CHANGE'){
  r=await c.query('SELECT price_kes FROM products WHERE id=$1 FOR UPDATE',[id]);
 }else if(kind==='STOCK_ADJUSTMENT'){
  // Lock the product before its batch, matching the receiving and sale lock order.
  const b=await c.query('SELECT product_id FROM inventory_batches WHERE id=$1',[id]);
  if(!b.rowCount)throw new Error('Batch not found.');
  const product=(await c.query('SELECT id,stock FROM products WHERE id=$1 FOR UPDATE',[b.rows[0].product_id])).rows[0];
  r=await c.query(`SELECT b.product_id,b.warehouse_id,b.bin_id,b.available_qty,b.received_qty,b.status,w.location_id FROM inventory_batches b JOIN warehouses w ON w.id=b.warehouse_id WHERE b.id=$1 AND w.active AND w.storage_type='BRAND' FOR UPDATE OF b`,[id]);
  if(r.rowCount){
   const row=r.rows[0];
   if(!['AVAILABLE','DEPLETED'].includes(row.status))throw new Error('Only available or depleted stock can be adjusted.');
   if(p.quantity>row.received_qty)throw new Error('Count cannot exceed the original batch receipt. Receive additional parts as a new batch.');
   await assertStock(c,{id:row.product_id,part_no:String(row.product_id),stock:product.stock},row.location_id,Math.max(0,row.available_qty-p.quantity));
   row.stock=product.stock;
  }
 }else if(kind==='REFUND'){
  const pos=p.source==='POS';
  r=await c.query(pos?'SELECT total_kes,cashier_id,location_id FROM counter_sales WHERE id=$1 FOR UPDATE':'SELECT total_kes,payment_status,location_id FROM orders WHERE id=$1 FOR UPDATE',[id]);
  if(r.rowCount){
   const row=r.rows[0];
   if(!pos&&!['Paid','Completed'].includes(row.payment_status))throw new Error('Only a paid online order can be refunded.');
   const sum=await c.query(`SELECT COALESCE(SUM(amount_kes),0)::int amount FROM approved_refunds WHERE ${pos?'sale_id':'order_id'}=$1`,[id]);
   row.refunded=sum.rows[0].amount;
   if(p.amountKes>Number(row.total_kes)-row.refunded)throw new Error('Refund exceeds the remaining paid amount.');
   if(user.role==='cashier'&&(!pos||String(row.cashier_id)!==String(user.id)))throw new Error('Cashiers may request changes only to their own counter sales.');
  }
 }else if(kind==='SALE_CORRECTION'){
  r=await c.query('SELECT customer_name,payment_reference,payment_method,cashier_id,location_id FROM counter_sales WHERE id=$1 FOR UPDATE',[id]);
  if(r.rowCount){
   if(user.role==='cashier'&&String(r.rows[0].cashier_id)!==String(user.id))throw new Error('Cashiers may request changes only to their own counter sales.');
   if(p.field==='payment_reference'&&r.rows[0].payment_method==='Cash')throw new Error('Cash sales have no electronic payment reference.');
  }
 }else if(kind==='ORDER_CORRECTION'){
  await c.query('SELECT id FROM warehouse_orders WHERE order_id=$1 FOR UPDATE',[id]);
  r=await c.query('SELECT status,payment_status,location_id FROM orders WHERE id=$1 FOR UPDATE',[id]);
  if(r.rowCount&&r.rows[0].status==='Cancelled'&&p.status&&p.status!=='Cancelled')throw new Error('Cancelled orders cannot be reopened.');
  if(p.paymentStatus){
   const credits=await c.query('SELECT id FROM approved_refunds WHERE order_id=$1 LIMIT 1',[id]);
   if(credits.rowCount)throw new Error('Payment status cannot be rewritten after an approved refund. Use the refund ledger.');
  }
 }else if(kind==='GARAGE_CORRECTION'){
  r=await c.query('SELECT customer_name,phone,vehicle,registration,service,status,version,location_id FROM garage_jobs WHERE id=$1 FOR UPDATE',[id]);
 }
 if(!r?.rowCount)throw new Error('Record not found.');
 if(r.rows[0].location_id&&String(r.rows[0].location_id)!==String(user.location_id)&&!['admin','general_manager'].includes(user.role))throw new Error('Record is outside your assigned location.');
 return r.rows[0];
}
export async function createRequest(c,user,body){
 user=await currentActor(c,user.id||user.sub);
 const kind=body.kind;
 if(!allowedRequestKinds(user.role).includes(kind))throw new Error('Your department cannot submit this type of request.');
 const targetId=whole(body.targetId,'Record ID'),reason=text(body.reason,'Reason',1000),payload=normalizeProposal(kind,body.payload);
 const key=String(body.requestKey||'');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))throw new Error('A request key is required.');
 await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
 const existing=await c.query('SELECT * FROM staff_requests WHERE request_key=$1',[key]);
 if(existing.rowCount){const e=existing.rows[0];if(String(e.requested_by)!==String(user.id)||e.kind!==kind||String(e.target_id)!==String(targetId)||e.reason!==reason||!same(normalizeProposal(kind,e.payload),payload))throw new Error('Request key has already been used.');return e;}
 const before=await snapshot(c,kind,targetId,payload,user);
 const status=user.role==='general_manager'?'PENDING_ADMIN':'PENDING_MANAGER';
 const r=await c.query(`INSERT INTO staff_requests(request_key,kind,target_id,payload,before_values,reason,requested_by,requester_role,status) VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9) RETURNING *`,[key,kind,targetId,JSON.stringify(payload),JSON.stringify(before),reason,user.id,user.role,status]);
 await audit(c,user,'REQUEST_CREATED',r.rows[0].id,{kind,targetId,payload,before,reason});
 return r.rows[0];
}
export async function decideRequest(c,user,id,action,note){
 user=await currentActor(c,user.id||user.sub);
 id=whole(id,'Request ID');note=text(note,'Review note',1000);
 const r=await c.query('SELECT * FROM staff_requests WHERE id=$1 FOR UPDATE',[id]);
 const request=r.rows[0];if(!request)throw new Error('Request not found.');
 const manager=user.role==='general_manager'&&request.status==='PENDING_MANAGER';
 const admin=user.role==='admin'&&request.status==='PENDING_ADMIN';
 if(!['REJECT','APPROVE'].includes(action)||(!manager&&!admin))throw new Error('This request is not awaiting your approval.');
 if(manager&&String(request.requested_by)===String(user.id)||String(request.reviewed_by)===String(user.id))throw new Error('Independent review is required.');
 if(action==='REJECT'){
  await c.query(`UPDATE staff_requests SET status='REJECTED',review_note=$1 WHERE id=$2`,[note,id]);
 }else if(manager){
  await c.query(`UPDATE staff_requests SET status='PENDING_ADMIN',reviewed_by=$1,review_note=$2,reviewed_at=NOW() WHERE id=$3`,[user.id,note,id]);
 }else{
  if(request.requester_role!=='general_manager'&&!request.reviewed_by)throw new Error('General manager review is required.');
  const p=request.payload;
  const before=await snapshot(c,request.kind,request.target_id,p,user);
  // JSONB key order is normalized by PostgreSQL; compare by keys, not insertion order.
  if(Object.keys(before).some(k=>!same(before[k],request.before_values[k])))throw new Error('The original record changed. Reject this request and submit a new one for review.');
  if(request.kind==='PRICE_CHANGE')await c.query('UPDATE products SET price_kes=$1,updated_at=NOW() WHERE id=$2',[p.priceKes,request.target_id]);
  if(request.kind==='STOCK_ADJUSTMENT'){
   const delta=p.quantity-before.available_qty;
   if(!delta)throw new Error('The count has not changed.');
   await c.query(`UPDATE inventory_batches SET available_qty=$1,status=CASE WHEN $1=0 THEN 'DEPLETED' ELSE 'AVAILABLE' END WHERE id=$2`,[p.quantity,request.target_id]);
   await c.query('UPDATE products SET stock=stock+$1,updated_at=NOW() WHERE id=$2',[delta,before.product_id]);
   await c.query(`INSERT INTO inventory_movements(product_id,batch_id,warehouse_id,bin_id,movement_type,quantity,reference_type,reference_id,notes,created_by) VALUES($1,$2,$3,$4,'ADJUSTMENT',$5,'APPROVED_REQUEST',$6,$7,$8)`,[before.product_id,request.target_id,before.warehouse_id,before.bin_id,delta,String(id),request.reason,user.id]);
  }
  if(request.kind==='REFUND')await c.query(`INSERT INTO approved_refunds(request_id,sale_id,order_id,amount_kes) VALUES($1,$2,$3,$4)`,[id,p.source==='POS'?request.target_id:null,p.source==='ONLINE'?request.target_id:null,p.amountKes]);
  if(request.kind==='SALE_CORRECTION')await c.query(`UPDATE counter_sales SET ${p.field==='customer_name'?'customer_name':'payment_reference'}=$1 WHERE id=$2`,[p.value,request.target_id]);
  if(request.kind==='ORDER_CORRECTION'){
   if(p.status==='Cancelled')await cancelUnpickedOrder(c,request.target_id);
   await c.query('UPDATE orders SET status=COALESCE($1,status),payment_status=COALESCE($2,payment_status),updated_at=NOW() WHERE id=$3',[p.status,p.paymentStatus,request.target_id]);
  }
  if(request.kind==='GARAGE_CORRECTION'){
   const safe=normalizeProposal(request.kind,p);
   await c.query(`UPDATE garage_jobs SET ${safe.field}=$1,version=version+1,updated_at=NOW() WHERE id=$2`,[safe.value,request.target_id]);
  }
  await c.query(`UPDATE staff_requests SET status='APPLIED',approved_by=$1,approved_at=NOW() WHERE id=$2`,[user.id,id]);
 }
 await audit(c,user,action==='REJECT'?'REQUEST_REJECTED':manager?'REQUEST_REVIEWED':'REQUEST_APPLIED',id,{note,kind:request.kind,before:request.before_values,payload:request.payload});
 return (await c.query('SELECT * FROM staff_requests WHERE id=$1',[id])).rows[0];
}
export async function recordRefundPayout(c,user,id,reference){
 user=await currentActor(c,user.id||user.sub);
 if(user.role!=='admin')throw new Error('Only the administrator can record a refund payout.');
 reference=text(reference,'Actual payout reference or cash voucher number',100);
 const r=await c.query('SELECT * FROM approved_refunds WHERE id=$1 FOR UPDATE',[whole(id,'Refund ID')]);
 if(!r.rowCount)throw new Error('Approved refund not found.');
 if(r.rows[0].status==='PAID'){if(r.rows[0].payout_reference===reference)return r.rows[0];throw new Error('Refund payout already recorded.');}
 const result=await c.query(`UPDATE approved_refunds SET status='PAID',payout_reference=$1,paid_by=$2,paid_at=NOW() WHERE id=$3 RETURNING *`,[reference,user.id,id]);
 await audit(c,user,'REFUND_PAYOUT_RECORDED',r.rows[0].request_id,{refundId:id,reference});
 return result.rows[0];
}
