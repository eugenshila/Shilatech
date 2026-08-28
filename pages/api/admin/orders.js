import { readSession } from '../../../lib/auth';
export default async function handler(req,res){
 const user=await readSession(req);
 if(!user)return res.status(401).json({error:'Staff sign-in required.'});
 if(user.role!=='admin')return res.status(403).json({error:'Administrator access required.'});
 return res.status(409).json({error:'Order corrections require general manager review and administrator approval. Use Requests & approvals.',requestUrl:'/approvals'});
}
