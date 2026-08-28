import {getPool} from '../../lib/db';
import {readSession} from '../../lib/auth';
import {staffPages} from '../../lib/staff-access.mjs';
import {reviewers,hrSchema,validateLeave,reviewLeave} from '../../lib/hr-workflow.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
 const s=await readSession(req);
 if(!s)return res.status(401).json({error:'Staff sign-in required.'});
 if(!staffPages(s.role).includes('/my-hr'))return res.status(403).json({error:'Staff access required.'});
 if(req.method==='POST'&&(!String(req.headers['content-type']||'').startsWith('application/json')||req.headers['sec-fetch-site']==='cross-site'))return res.status(403).json({error:'Use the staff portal to submit changes.'});
 let c,transaction=false;
 try{
  c=await getPool().connect();
  if(req.method==='GET'){
   const ready=await c.query("SELECT to_regclass('public.hr_leave_requests') AS leaves,to_regclass('public.payroll_entries') AS payroll");
   const canReview=reviewers.includes(s.role);
   const leaves=ready.rows[0].leaves?await c.query('SELECT l.*,u.name AS employee_name FROM hr_leave_requests l JOIN customers u ON u.id=l.employee_id WHERE l.employee_id=$1 OR $2 ORDER BY l.created_at DESC LIMIT 100',[s.id,canReview]):{rows:[]};
   const payslips=ready.rows[0].payroll?await c.query("SELECT id,period,employee_name,status,amounts FROM payroll_entries WHERE employee_id=$1 AND status='APPROVED' ORDER BY period DESC LIMIT 50",[s.id]):{rows:[]};
   const staff=['admin','hr'].includes(s.role)?await c.query("SELECT id,name,email,role FROM customers WHERE role<>'customer' ORDER BY name,email"):{rows:[]};
   const events=ready.rows[0].leaves?await c.query('SELECT e.*,u.name AS actor_name FROM hr_events e JOIN customers u ON u.id=e.actor_id JOIN hr_leave_requests l ON l.id=e.leave_id WHERE l.employee_id=$1 OR $2 ORDER BY e.created_at DESC LIMIT 200',[s.id,canReview]):{rows:[]};
   return res.json({userId:s.id,role:s.role,ready:Boolean(ready.rows[0].leaves),leaves:leaves.rows,payslips:payslips.rows,staff:staff.rows,events:events.rows});
  }
  const b=req.body||{};
  await c.query('BEGIN');transaction=true;
  if(b.action==='SETUP'){
   if(s.role!=='admin')throw Error('Administrator access required.');
   await c.query('SELECT pg_advisory_xact_lock(184029)');
   for(const sql of hrSchema)await c.query(sql);
  }else if(b.action==='LEAVE'){
   const v=validateLeave(b);
   const q=await c.query('INSERT INTO hr_leave_requests(employee_id,start_date,end_date,leave_type,reason) VALUES($1,$2,$3,$4,$5) RETURNING id',[s.id,v.start,v.end,v.type,v.reason]);
   await c.query("INSERT INTO hr_events(leave_id,actor_id,action,note) VALUES($1,$2,'SUBMITTED','Leave application submitted')",[q.rows[0].id,s.id]);
  }else if(b.action==='DECIDE')await reviewLeave(c,s,b);
  else throw Error('Unsupported HR action.');
  await c.query('COMMIT');transaction=false;return res.json({ok:true});
 }catch(e){if(transaction)await c.query('ROLLBACK');console.error(e);return res.status(400).json({error:e.code?'HR records could not be updated. Ask the administrator to check setup.':e.message||'HR request failed.'});}
 finally{c?.release();}
}
