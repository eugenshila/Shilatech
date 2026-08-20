import { getPool } from '../../../lib/db';
import { requireDeliveryStaff } from '../../../lib/delivery-auth';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const session=requireDeliveryStaff(req,res); if(!session) return;
  const deliveryId=Number(req.body?.deliveryId);
  const recipientName=String(req.body?.recipientName||'').trim();
  const signatureData=String(req.body?.signatureData||'').trim();
  const notes=String(req.body?.notes||'').trim()||null;
  const lat=req.body?.lat==null?null:Number(req.body.lat);
  const lng=req.body?.lng==null?null:Number(req.body.lng);
  if(!Number.isInteger(deliveryId)||!recipientName||!signatureData.startsWith('data:image/')) return res.status(400).json({error:'Recipient name and signature are required.'});
  if(signatureData.length>900000) return res.status(400).json({error:'Signature image is too large.'});

  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const q=await client.query(`SELECT dj.*,wo.order_id,wo.job_no,o.order_no,o.payment_method,o.payment_status FROM delivery_jobs dj JOIN warehouse_orders wo ON wo.id=dj.warehouse_order_id JOIN orders o ON o.id=wo.order_id WHERE dj.id=$1 FOR UPDATE`,[deliveryId]);
    if(!q.rowCount) throw new Error('Delivery job not found.');
    const d=q.rows[0];
    if(d.status==='DELIVERED') throw new Error('This delivery is already completed.');
    if(session.role==='delivery_driver'&&d.driver_id&&Number(d.driver_id)!==Number(session.sub)) throw new Error('This delivery is assigned to another driver.');
    if(String(d.payment_method).toLowerCase()==='m-pesa'&&String(d.payment_status).toLowerCase()!=='paid') throw new Error('Payment is still pending. Prompt the customer for M-Pesa payment and wait for confirmation before completing delivery.');
    await client.query(`UPDATE delivery_jobs SET driver_id=COALESCE(driver_id,$1),status='DELIVERED',recipient_name=$2,signature_data=$3,gps_lat=$4,gps_lng=$5,delivery_notes=$6,signed_at=NOW(),delivered_at=NOW(),updated_at=NOW() WHERE id=$7`,[Number(session.sub),recipientName,signatureData,Number.isFinite(lat)?lat:null,Number.isFinite(lng)?lng:null,notes,deliveryId]);
    await client.query(`UPDATE orders SET status='Delivered',updated_at=NOW() WHERE id=$1`,[d.order_id]);
    await client.query(`UPDATE warehouse_orders SET status='COMPLETED',updated_at=NOW() WHERE id=$1`,[d.warehouse_order_id]);
    await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,'PROOF_OF_DELIVERY','delivery_job',$2,$3::jsonb)`,[Number(session.sub),String(deliveryId),JSON.stringify({jobNo:d.job_no,orderNo:d.order_no,recipientName,lat:Number.isFinite(lat)?lat:null,lng:Number.isFinite(lng)?lng:null})]);
    await client.query('COMMIT');
    res.status(200).json({ok:true,status:'Delivered'});
  }catch(error){await client.query('ROLLBACK');console.error(error);res.status(400).json({error:error.message||'Could not complete delivery.'});}
  finally{client.release();}
}
