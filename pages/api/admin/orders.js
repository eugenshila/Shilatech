import { getPool } from '../../../lib/db';
import { readSession } from '../../../lib/auth';
import { cancelUnpickedOrder } from '../../../lib/cancel-order.mjs';
const statuses=['Pending','Processing','Shipped','Out for Delivery','Delivered','Cancelled'];
const payments=['Pending','Paid','Completed','Failed','Refunded'];
export default async function handler(req,res){
 const s=readSession(req);if(!s)return res.status(401).json({error:'Sign in required.'});
 if(s.role!=='admin')return res.status(403).json({error:'Admin access required.'});
 if(req.method!=='PUT')return res.status(405).json({error:'Method not allowed'});
 const id=Number(req.body?.id),status=req.body?.status||null,payment=req.body?.paymentStatus||null;
 if(!Number.isSafeInteger(id)||id<1||(!status&&!payment)||(status&&!statuses.includes(status))||(payment&&!payments.includes(payment)))return res.status(400).json({error:'Invalid order update.'});
 const c=await getPool().connect();
 try{
  await c.query('BEGIN');
  await c.query('SELECT id FROM warehouse_orders WHERE order_id=$1 FOR UPDATE',[id]);
  const old=await c.query('SELECT status FROM orders WHERE id=$1 FOR UPDATE',[id]);
  if(!old.rowCount)throw new Error('Order not found.');
  if(old.rows[0].status==='Cancelled'&&status&&status!=='Cancelled')throw new Error('Cancelled orders cannot be reopened. Create a new order.');
  if(status==='Cancelled')await cancelUnpickedOrder(c,id);
  const r=await c.query('UPDATE orders SET status=COALESCE($1,status),payment_status=COALESCE($2,payment_status),updated_at=NOW() WHERE id=$3 RETURNING id,order_no,status,payment_status,updated_at',[status,payment,id]);
  await c.query(`INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'ADMIN_ORDER_UPDATE','order',$2,$3::jsonb)`,[s.sub,String(id),JSON.stringify({status,paymentStatus:payment})]);
  await c.query('COMMIT');return res.json({order:r.rows[0]});
 }catch(e){await c.query('ROLLBACK');console.error(e);return res.status(400).json({error:e.message});}finally{c.release();}
}
