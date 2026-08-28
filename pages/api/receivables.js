import {getPool} from '../../lib/db';
import {readSession} from '../../lib/auth';
import {financeRoles,ready,execute,seesAll} from '../../lib/receivables.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
 const s=await readSession(req);if(!s)return res.status(401).json({error:'Staff sign-in required.'});if(!financeRoles.includes(s.role))return res.status(403).json({error:'Sales or finance access required.'});
 if(req.method==='POST'&&(!String(req.headers['content-type']||'').startsWith('application/json')||req.headers['sec-fetch-site']==='cross-site'))return res.status(403).json({error:'Use the staff portal to submit changes.'});
 let c,tx=false;
 try{
  c=await getPool().connect();
  if(req.method==='POST'){await c.query('BEGIN');tx=true;const r=await execute(c,s,req.body||{});await c.query('COMMIT');tx=false;return res.json(r);}
  if(!await ready(c))return res.json({ready:false,user:{id:s.id,name:s.name,role:s.role}});
  const params=[s.id,seesAll(s)];
  const clients=await c.query('SELECT * FROM ar_clients WHERE created_by=$1 OR $2 ORDER BY name LIMIT 500',params);
  const docs=await c.query(`SELECT d.*,u.name AS salesperson_name,d.total_kes-d.paid_kes AS balance_kes,d.kind='INVOICE' AND d.status='OPEN' AND d.total_kes>d.paid_kes AND d.due_on<(NOW() AT TIME ZONE 'Africa/Nairobi')::date AS overdue,(SELECT x.id FROM ar_documents x WHERE x.quote_id=d.id) AS invoice_id FROM ar_documents d JOIN customers u ON u.id=d.salesperson_id WHERE d.salesperson_id=$1 OR $2 ORDER BY d.created_at DESC LIMIT 200`,params);
  const payments=await c.query('SELECT p.*,d.number FROM ar_payments p JOIN ar_documents d ON d.id=p.invoice_id WHERE d.salesperson_id=$1 OR $2 ORDER BY p.created_at DESC LIMIT 200',params);
  const totals=await c.query(`SELECT COALESCE(SUM(total_kes),0) AS invoiced,COALESCE(SUM(paid_kes),0) AS collected,COALESCE(SUM(total_kes-paid_kes),0) AS outstanding,COALESCE(SUM(total_kes-paid_kes) FILTER(WHERE due_on<(NOW() AT TIME ZONE 'Africa/Nairobi')::date),0) AS overdue FROM ar_documents WHERE kind='INVOICE' AND status='OPEN' AND (salesperson_id=$1 OR $2)`,params);
  const monthly=await c.query(`SELECT to_char(issued_on,'YYYY-MM') AS month,SUM(total_kes) AS amount FROM ar_documents WHERE kind='INVOICE' AND status='OPEN' AND issued_on>=date_trunc('month',(NOW() AT TIME ZONE 'Africa/Nairobi'))::date-interval '5 months' AND (salesperson_id=$1 OR $2) GROUP BY 1 ORDER BY 1`,params);
  const products=await c.query('SELECT id,name,part_no,price_kes FROM products WHERE active=TRUE ORDER BY name LIMIT 500');
  return res.json({ready:true,user:{id:s.id,name:s.name,role:s.role},clients:clients.rows,documents:docs.rows,payments:payments.rows,totals:totals.rows[0],monthly:monthly.rows,products:products.rows});
 }catch(e){if(tx)await c.query('ROLLBACK');return res.status(400).json({error:e.code==='23505'?'That payment reference or document has already been recorded. Refresh the list before retrying.':e.code?'Sales and finance records could not be saved.':e.message||'Request failed.'});}finally{c?.release();}
}
