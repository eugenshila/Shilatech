import { getPool } from '../../lib/db';
import { readSession } from '../../lib/auth';
import { staffPages } from '../../lib/staff-access.mjs';
import { allowedRequestKinds,createRequest,decideRequest,recordRefundPayout } from '../../lib/approvals.mjs';

export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 const user=await readSession(req);
 if(!user)return res.status(401).json({error:'Staff sign-in required.'});
 if(!staffPages(user.role).length)return res.status(403).json({error:'Staff access required.'});
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
 const c=await getPool().connect();
 try{
  if(req.method==='GET'){
   const management=['admin','general_manager'].includes(user.role);
   const requests=await c.query(`SELECT r.*,u.name requester_name,m.name reviewer_name,a.name approver_name FROM staff_requests r JOIN customers u ON u.id=r.requested_by LEFT JOIN customers m ON m.id=r.reviewed_by LEFT JOIN customers a ON a.id=r.approved_by WHERE ($1 OR r.requested_by=$2) ORDER BY r.created_at DESC LIMIT 150`,[management,user.id]);
   const refunds=await c.query(`SELECT f.*,s.sale_no,o.order_no FROM approved_refunds f JOIN staff_requests r ON r.id=f.request_id LEFT JOIN counter_sales s ON s.id=f.sale_id LEFT JOIN orders o ON o.id=f.order_id WHERE ($1 OR r.requested_by=$2) ORDER BY f.created_at DESC LIMIT 100`,[management,user.id]);
   // The request form offers only records this department can reference.
   const kinds=allowedRequestKinds(user.role),targets={};
   if(kinds.includes('PRICE_CHANGE'))targets.products=(await c.query('SELECT id,part_no,name,price_kes FROM products WHERE active ORDER BY name LIMIT 1000')).rows;
   if(kinds.includes('STOCK_ADJUSTMENT'))targets.batches=(await c.query(`SELECT b.id,b.batch_no,b.available_qty,p.part_no,w.name warehouse FROM inventory_batches b JOIN products p ON p.id=b.product_id JOIN warehouses w ON w.id=b.warehouse_id WHERE w.location_id=$1 AND w.active AND w.storage_type='BRAND' AND b.status IN ('AVAILABLE','DEPLETED') ORDER BY b.received_at DESC LIMIT 1000`,[user.location_id])).rows;
   if(kinds.includes('SALE_CORRECTION'))targets.sales=(await c.query(`SELECT id,sale_no,total_kes,customer_name FROM counter_sales WHERE location_id=$1 AND ($2 OR cashier_id=$3) ORDER BY created_at DESC LIMIT 1000`,[user.location_id,management,user.id])).rows;
   if(management)targets.orders=(await c.query('SELECT id,order_no,total_kes,status,payment_status FROM orders ORDER BY created_at DESC LIMIT 1000')).rows;
   if(kinds.includes('GARAGE_CORRECTION'))targets.jobs=(await c.query('SELECT id,job_no,registration,status FROM garage_jobs WHERE location_id=$1 ORDER BY created_at DESC LIMIT 1000',[user.location_id])).rows;
   return res.json({user:{id:user.id,name:user.name,role:user.role},kinds,requests:requests.rows,refunds:refunds.rows,targets});
  }
  await c.query('BEGIN');
  const b=req.body||{};let result;
  if(b.action==='CREATE')result=await createRequest(c,user,b);
  else if(b.action==='APPROVE'||b.action==='REJECT')result=await decideRequest(c,user,b.id,b.action,b.note);
  else if(b.action==='RECORD_PAYOUT')result=await recordRefundPayout(c,user,b.id,b.reference);
  else throw new Error('Unknown action.');
  await c.query('COMMIT');return res.json({result});
 }catch(e){if(req.method==='POST')await c.query('ROLLBACK');console.error(e);return res.status(400).json({error:e.code==='23505'?'This reference is already recorded.':e.message||'Request failed.'});}
 finally{c.release();}
}
