import {getPool} from '../../lib/db';
import {readSession} from '../../lib/auth';
import {executeLedger,readLedger} from '../../lib/finance-ledger.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
 const s=await readSession(req);if(!s)return res.status(401).json({error:'Staff sign-in required.'});if(!['admin','finance','general_manager','cashier'].includes(s.role))return res.status(403).json({error:'Finance access required.'});
 if(req.method==='POST'&&(!String(req.headers['content-type']||'').startsWith('application/json')||req.headers['sec-fetch-site']==='cross-site'))return res.status(403).json({error:'Use the staff portal.'});
 let c,tx=false;try{c=await getPool().connect();if(req.method==='POST'){await c.query('BEGIN');tx=true;const result=await executeLedger(c,s,req.body||{});await c.query('COMMIT');tx=false;return res.json(result);}
 const period=req.query.period||new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi',year:'numeric',month:'2-digit'}).format(new Date()).slice(0,7);return res.json(await readLedger(c,s,period));
 }catch(e){if(tx)await c.query('ROLLBACK');return res.status(400).json({error:e.code==='23505'?'This bill, payroll or payment reference already exists. Refresh before retrying.':e.code?'Finance records could not be processed. Check module setup.':e.message});}finally{c?.release();}
}
