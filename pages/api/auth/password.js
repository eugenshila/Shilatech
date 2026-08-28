import {readSession,signSession,setSession} from '../../../lib/auth';
import {getPool} from '../../../lib/db';
import {changeOwnPassword} from '../../../lib/account-security.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
 const user=await readSession(req);if(!user)return res.status(401).json({error:'Sign in first.'});
 const c=await getPool().connect();
 try{await c.query('BEGIN');const updated=await changeOwnPassword(c,user.sub,req.body?.currentPassword,req.body?.newPassword);const token=signSession(updated);await c.query('COMMIT');setSession(res,token);return res.json({ok:true});}
 catch(e){await c.query('ROLLBACK');return res.status(400).json({error:e.message||'Could not change password.'});}finally{c.release();}
}
