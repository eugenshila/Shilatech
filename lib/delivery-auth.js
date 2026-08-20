import { readSession } from './auth';

const DELIVERY_ROLES = new Set(['admin','warehouse_manager','dispatch','delivery_driver']);

export function requireDeliveryStaff(req,res){
  const session=readSession(req);
  if(!session){res.status(401).json({error:'Delivery staff sign-in required.'});return null;}
  if(!DELIVERY_ROLES.has(session.role)){res.status(403).json({error:'Delivery portal access denied.'});return null;}
  return session;
}
