import { getPool } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const session=requireWarehouseStaff(req,res,['warehouse_manager','picker','dispatch']); if(!session)return;
  const productId=Number(req.body?.productId),warehouseId=Number(req.body?.warehouseId),quantity=Number(req.body?.quantity);
  const referenceType=String(req.body?.referenceType||'MANUAL').trim().toUpperCase();
  const referenceId=String(req.body?.referenceId||'').trim()||null;
  if(!Number.isInteger(productId)||!Number.isInteger(warehouseId)||!Number.isInteger(quantity)||quantity<=0) return res.status(400).json({error:'Product, warehouse and positive quantity are required.'});

  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const product=await client.query(`SELECT id,part_no,name,stock FROM products WHERE id=$1 FOR UPDATE`,[productId]); if(!product.rowCount)throw new Error('Product not found.');
    const batches=await client.query(`SELECT id,available_qty,bin_id,batch_no,received_at FROM inventory_batches WHERE product_id=$1 AND warehouse_id=$2 AND available_qty>0 AND status='AVAILABLE' ORDER BY received_at ASC,id ASC FOR UPDATE`,[productId,warehouseId]);
    const available=batches.rows.reduce((sum,b)=>sum+Number(b.available_qty),0); if(available<quantity)throw new Error(`Insufficient FIFO stock. Available: ${available}.`);
    let remaining=quantity; const allocations=[];
    for(const batch of batches.rows){if(remaining<=0)break;const take=Math.min(remaining,Number(batch.available_qty));await client.query(`UPDATE inventory_batches SET available_qty=available_qty-$1,status=CASE WHEN available_qty-$1=0 THEN 'DEPLETED' ELSE status END WHERE id=$2`,[take,batch.id]);await client.query(`INSERT INTO inventory_movements (product_id,batch_id,warehouse_id,bin_id,movement_type,quantity,reference_type,reference_id,notes,created_by) VALUES ($1,$2,$3,$4,'ISSUE',$5,$6,$7,$8,$9)`,[productId,batch.id,warehouseId,batch.bin_id,-take,referenceType,referenceId,`FIFO issue from batch ${batch.batch_no}`,Number(session.sub)]);allocations.push({batchId:batch.id,batchNo:batch.batch_no,quantity:take,receivedAt:batch.received_at,binId:batch.bin_id});remaining-=take;}
    if(referenceType!=='ORDER') await client.query(`UPDATE products SET stock=GREATEST(stock-$1,0),updated_at=NOW() WHERE id=$2`,[quantity,productId]);
    await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,'FIFO_ISSUE','product',$2,$3::jsonb)`,[Number(session.sub),String(productId),JSON.stringify({quantity,warehouseId,referenceType,referenceId,allocations})]);
    await client.query('COMMIT');res.status(200).json({ok:true,allocations});
  }catch(error){await client.query('ROLLBACK');console.error(error);res.status(400).json({error:error.message||'Could not issue stock.'});}finally{client.release();}
}
