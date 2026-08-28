import { readSession } from '../../lib/auth';
import { getPool } from '../../lib/db';
import { saveGarageJob } from '../../lib/garage-jobs.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 const user=await readSession(req);
 if(!user)return res.status(401).json({error:'Staff sign-in required.'});
 if(!['admin','general_manager','garage_staff'].includes(user.role))return res.status(403).json({error:'Garage staff access required.'});
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
 if(req.method==='POST'&&user.role==='general_manager')return res.status(403).json({error:'General manager access is read-only. Submit a correction request.'});
 const c=await getPool().connect();
 try{
  if(req.method==='GET'){
   const r=await c.query(`SELECT j.*,COALESCE((SELECT json_agg(json_build_object('id',n.id,'note',n.note,'employee',u.name,'created_at',n.created_at) ORDER BY n.created_at DESC) FROM garage_job_notes n JOIN customers u ON u.id=n.employee_id WHERE n.job_id=j.id),'[]'::json) notes FROM garage_jobs j WHERE location_id=$1 ORDER BY created_at DESC LIMIT 200`,[user.location_id]);
   return res.json({jobs:r.rows,user:{id:user.id,name:user.name,role:user.role}});
  }
  await c.query('BEGIN');const job=await saveGarageJob(c,user,req.body||{});await c.query('COMMIT');return res.json({job});
 }catch(e){if(req.method==='POST')await c.query('ROLLBACK');console.error(e);return res.status(400).json({error:e.message||'Garage update failed.'});}finally{c.release();}
}
