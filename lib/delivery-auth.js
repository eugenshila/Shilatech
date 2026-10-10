import { readSession } from './auth';
import { PROOF_ROLES } from './delivery-complete';

const DELIVERY_ROLES = new Set(['admin','general_manager','dispatch','delivery_driver']);
const PROOF_ROLE_SET = new Set(PROOF_ROLES);

export async function requireDeliveryStaff(req,res){
  const session=await readSession(req);
  if(!session){res.status(401).json({error:'Delivery staff sign-in required.'});return null;}
  if(!DELIVERY_ROLES.has(session.role)){res.status(403).json({error:'Delivery portal access denied.'});return null;}
  if(session.role==='general_manager'&&req.method!=='GET'){res.status(403).json({error:'General manager access is read-only.'});return null;}
  return session;
}

// Proof of delivery and M-Pesa prompts: the PDA roles plus the warehouse operator, who runs the whole chain from one card.
export async function requireProofStaff(req,res){
  const session=await readSession(req);
  if(!session){res.status(401).json({error:'Delivery staff sign-in required.'});return null;}
  if(!PROOF_ROLE_SET.has(session.role)){res.status(403).json({error:'Delivery portal access denied.'});return null;}
  if(session.role==='general_manager'&&req.method!=='GET'){res.status(403).json({error:'General manager access is read-only.'});return null;}
  return session;
}
