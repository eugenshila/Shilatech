import { getPool } from '../../../../lib/db';
import { requireDeliveryStaff } from '../../../../lib/delivery-auth';
import { sendStkPush } from '../../../../lib/mpesa';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const session=await requireDeliveryStaff(req,res); if(!session) return;
  const deliveryId=Number(req.body?.deliveryId); const phone=String(req.body?.phone||'').trim();
  if(!Number.isInteger(deliveryId)) return res.status(400).json({error:'Delivery job is required.'});
  const pool=getPool(); const client=await pool.connect();
  try{
    const q=await client.query(`SELECT dj.id,dj.driver_id,o.id AS order_id,o.order_no,o.phone,o.total_kes,o.payment_method,o.payment_status FROM delivery_jobs dj JOIN warehouse_orders wo ON wo.id=dj.warehouse_order_id JOIN orders o ON o.id=wo.order_id WHERE dj.id=$1`,[deliveryId]);
    if(!q.rowCount) return res.status(404).json({error:'Delivery not found.'});
    const d=q.rows[0];
    if(session.role==='delivery_driver'&&Number(d.driver_id)!==Number(session.sub)) return res.status(403).json({error:'This delivery is not assigned to you.'});
    if(String(d.payment_status).toLowerCase()==='paid') return res.status(409).json({error:'This order is already paid. No payment prompt is allowed.'});
    if(String(d.payment_method).toLowerCase()!=='m-pesa') return res.status(400).json({error:'This order is not configured for M-Pesa payment.'});
    const stk=await sendStkPush({phone:phone||d.phone,amount:Number(d.total_kes),accountReference:d.order_no,description:`Order ${d.order_no}`});
    await client.query(`INSERT INTO payment_requests(order_id,checkout_request_id,merchant_request_id,phone,amount_kes,status,raw_response,created_by) VALUES($1,$2,$3,$4,$5,'PENDING',$6::jsonb,$7)`,[d.order_id,stk.CheckoutRequestID,stk.MerchantRequestID||null,stk.phone,Number(d.total_kes),JSON.stringify(stk),Number(session.sub)]);
    await client.query(`INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'MPESA_STK_PROMPT','delivery_job',$2,$3::jsonb)`,[Number(session.sub),String(deliveryId),JSON.stringify({orderNo:d.order_no,phone:stk.phone,checkoutRequestId:stk.CheckoutRequestID})]);
    return res.status(200).json({ok:true,message:'M-Pesa payment prompt sent to customer.',checkoutRequestId:stk.CheckoutRequestID});
  }catch(error){console.error(error);return res.status(400).json({error:error.message||'Could not send M-Pesa prompt.'});}finally{client.release();}
}
