import { getPool } from '../../../../lib/db';

function meta(items,key){const x=(items||[]).find(i=>i.Name===key);return x?.Value??null;}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const cb=req.body?.Body?.stkCallback;
  if(!cb?.CheckoutRequestID) return res.status(200).json({ResultCode:0,ResultDesc:'Accepted'});
  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const q=await client.query(`SELECT pr.*,o.order_no,o.total_kes FROM payment_requests pr JOIN orders o ON o.id=pr.order_id WHERE pr.checkout_request_id=$1 FOR UPDATE`,[cb.CheckoutRequestID]);
    if(!q.rowCount){await client.query('ROLLBACK');return res.status(200).json({ResultCode:0,ResultDesc:'Accepted'});}
    const pr=q.rows[0]; const success=Number(cb.ResultCode)===0; const items=cb.CallbackMetadata?.Item||[];
    const amount=meta(items,'Amount'); const receipt=meta(items,'MpesaReceiptNumber');
    await client.query(`UPDATE payment_requests SET status=$1,result_code=$2,result_desc=$3,receipt_no=$4,raw_response=$5::jsonb,updated_at=NOW() WHERE id=$6`,[success?'PAID':'FAILED',String(cb.ResultCode),cb.ResultDesc||null,receipt?String(receipt):null,JSON.stringify(req.body),pr.id]);
    if(success && Number(amount)===Number(pr.amount_kes)){
      await client.query(`UPDATE orders SET payment_status='Paid',updated_at=NOW() WHERE id=$1`,[pr.order_id]);
      await client.query(`INSERT INTO warehouse_audit(action,entity_type,entity_id,details) VALUES('MPESA_PAYMENT_CONFIRMED','order',$1,$2::jsonb)`,[String(pr.order_id),JSON.stringify({orderNo:pr.order_no,receiptNo:receipt,amount})]);
    }
    await client.query('COMMIT');
    return res.status(200).json({ResultCode:0,ResultDesc:'Accepted'});
  }catch(error){await client.query('ROLLBACK');console.error(error);return res.status(200).json({ResultCode:0,ResultDesc:'Accepted'});}finally{client.release();}
}
