import { readSession } from './auth';

const DELIVERY_ROLES = new Set(['admin','general_manager','dispatch','delivery_driver']);

export async function requireDeliveryStaff(req,res){
  const session=await readSession(req);
  if(!session){res.status(401).json({error:'Delivery staff sign-in required.'});return null;}
  if(!DELIVERY_ROLES.has(session.role)){res.status(403).json({error:'Delivery portal access denied.'});return null;}
  if(session.role==='general_manager'&&req.method!=='GET'){res.status(403).json({error:'General manager access is read-only.'});return null;}
  return session;
}
