import { getPool } from '../../lib/db';
import { readSession } from '../../lib/auth';
import { requireCounterUser,createCounterSale,saleReceipt } from '../../lib/counter.mjs';

export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
 const session=readSession(req);if(!session)return res.status(401).json({error:'Sign in with your staff account.'});
 const client=await getPool().connect();
 try{
  let user;
  try{user=await requireCounterUser(client,session.sub);}catch(e){return res.status(403).json({error:e.message});}
  if(req.method==='POST'){
   await client.query('BEGIN');
   const receipt=await createCounterSale(client,user,req.body||{});
   await client.query('COMMIT');return res.status(201).json({receipt});
  }
  if(req.query.saleId){
   if(!/^\d+$/.test(String(req.query.saleId)))return res.status(400).json({error:'Invalid receipt.'});
   const receipt=await saleReceipt(client,req.query.saleId);
   if(!receipt||String(receipt.location_id)!==String(user.location_id)||(user.role==='cashier'&&String(receipt.cashier_id)!==String(user.id)))return res.status(404).json({error:'Receipt not found.'});
   return res.json({receipt});
  }
  const search=String(req.query.q||'').trim().slice(0,100);
  const products=await client.query(`SELECT p.id,p.name,p.part_no,p.barcode,p.price_kes,s.physical_qty,s.reserved_qty,s.available_qty,
   (p.stock=s.available_qty AND s.physical_qty>=s.reserved_qty) AS reconciled
   FROM products p JOIN location_stock s ON s.product_id=p.id AND s.location_id=$1
   WHERE p.active AND ($2='' OR p.name ILIKE '%'||$2||'%' OR p.part_no ILIKE '%'||$2||'%' OR p.barcode=$2)
   ORDER BY (p.barcode=$2 OR p.part_no=$2) DESC NULLS LAST,p.name LIMIT 60`,[user.location_id,search]);
  const daily=await client.query(`SELECT payment_method,COUNT(*)::int sales,COALESCE(SUM(total_kes),0) total_kes FROM counter_sales
   WHERE location_id=$1 AND (created_at AT TIME ZONE 'Africa/Nairobi')::date=(NOW() AT TIME ZONE 'Africa/Nairobi')::date
   AND ($2<>'cashier' OR cashier_id=$3) GROUP BY payment_method`,[user.location_id,user.role,user.id]);
  const recent=await client.query(`SELECT id,sale_no,total_kes,payment_method,created_at FROM counter_sales WHERE location_id=$1 AND ($2<>'cashier' OR cashier_id=$3) ORDER BY created_at DESC LIMIT 15`,[user.location_id,user.role,user.id]);
  return res.json({user,products:products.rows,daily:daily.rows,recent:recent.rows});
 }catch(error){
  if(req.method==='POST')await client.query('ROLLBACK');
  console.error(error);
  return res.status(req.method==='POST'?400:500).json({error:error.code==='23505'?'This payment reference has already been recorded. Check recent receipts.':req.method==='POST'?error.message:'Could not load the counter. Check the database migration.'});
 }finally{client.release();}
}
