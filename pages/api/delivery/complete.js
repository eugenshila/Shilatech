import { getPool } from '../../../lib/db';
import { requireProofStaff } from '../../../lib/delivery-auth';
import { parseProofOfDelivery, completeProofOfDelivery } from '../../../lib/delivery-complete';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const session=await requireProofStaff(req,res); if(!session) return;
  let input;
  try{ input=parseProofOfDelivery(req.body); }catch(error){ return res.status(400).json({error:error.message}); }

  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const result=await completeProofOfDelivery(client,session,input);
    await client.query('COMMIT');
    res.status(200).json({ok:true,status:result.status});
  }catch(error){await client.query('ROLLBACK');console.error(error);res.status(400).json({error:error.message||'Could not complete delivery.'});}
  finally{client.release();}
}
