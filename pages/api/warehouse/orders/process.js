import { getPool } from '../../../../lib/db';
import { requireWarehouseStaff } from '../../../../lib/warehouse-auth';

const actionRoles={
  START_PICKING:['warehouse_manager','picker'],
  PICK_ITEM:['warehouse_manager','picker'],
  START_PACKING:['warehouse_manager','packer'],
  READY_DISPATCH:['warehouse_manager','packer','dispatch'],
  DISPATCH:['warehouse_manager','dispatch']
};

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const action=String(req.body?.action||'').trim().toUpperCase();
  const session=await requireWarehouseStaff(req,res,actionRoles[action]||['warehouse_manager']);
  if(!session) return;
  const jobId=Number(req.body?.jobId);
  if(!Number.isInteger(jobId)) return res.status(400).json({error:'Warehouse job is required.'});

  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const jobQ=await client.query(`SELECT wo.*,o.id AS sales_order_id,o.order_no FROM warehouse_orders wo JOIN orders o ON o.id=wo.order_id WHERE wo.id=$1 FOR UPDATE`,[jobId]);
    if(!jobQ.rowCount) throw new Error('Warehouse order not found.');
    const job=jobQ.rows[0];

    if(action==='START_PICKING'){
      if(job.status!=='NEW') throw new Error('Only new orders can start picking.');
      await client.query(`UPDATE warehouse_orders SET status='PICKING',assigned_to=$1,updated_at=NOW() WHERE id=$2`,[Number(session.sub),jobId]);
      await client.query(`UPDATE orders SET status='Processing',updated_at=NOW() WHERE id=$1`,[job.sales_order_id]);
    } else if(action==='PICK_ITEM'){
      if(job.status!=='PICKING') throw new Error('Start picking before scanning parts.');
      const itemId=Number(req.body?.itemId); const scanned=String(req.body?.barcode||'').trim();
      if(!Number.isInteger(itemId)||!scanned) throw new Error('Item and scanned barcode are required.');
      const itemQ=await client.query(`SELECT wi.*,p.barcode,p.part_no AS product_part_no FROM warehouse_order_items wi JOIN products p ON p.id=wi.product_id WHERE wi.id=$1 AND wi.warehouse_order_id=$2 FOR UPDATE`,[itemId,jobId]);
      if(!itemQ.rowCount) throw new Error('Order item not found.');
      const item=itemQ.rows[0];
      if(item.status==='PICKED'||Number(item.picked_qty)>=Number(item.quantity)) throw new Error('This item is already fully picked.');
      const expected=String(item.barcode||item.product_part_no).trim().toUpperCase();
      if(scanned.toUpperCase()!==expected && scanned.toUpperCase()!==String(item.part_no).trim().toUpperCase()) throw new Error(`Barcode does not match ${item.part_no}.`);
      if(!item.storage_area_id) throw new Error('No brand storage area is assigned to this part.');
      const needed=Number(item.quantity)-Number(item.picked_qty);
      // Serialize the physical deduction with receiving, counter sales and new online reservations.
      await client.query('SELECT id FROM products WHERE id=$1 FOR UPDATE',[item.product_id]);
      const batches=await client.query(`SELECT id,available_qty,bin_id,batch_no,received_at FROM inventory_batches WHERE product_id=$1 AND warehouse_id=$2 AND available_qty>0 AND status='AVAILABLE' ORDER BY received_at ASC,id ASC FOR UPDATE`,[item.product_id,item.storage_area_id]);
      const available=batches.rows.reduce((s,b)=>s+Number(b.available_qty),0);
      if(available<needed) throw new Error(`Insufficient FIFO stock. Available ${available}, required ${needed}.`);
      let remaining=needed; const allocations=[];
      for(const batch of batches.rows){
        if(remaining<=0) break;
        const take=Math.min(remaining,Number(batch.available_qty));
        await client.query(`UPDATE inventory_batches SET available_qty=available_qty-$1,status=CASE WHEN available_qty-$1=0 THEN 'DEPLETED' ELSE status END WHERE id=$2`,[take,batch.id]);
        await client.query(`INSERT INTO inventory_movements (product_id,batch_id,warehouse_id,bin_id,movement_type,quantity,reference_type,reference_id,notes,created_by) VALUES ($1,$2,$3,$4,'ISSUE',$5,'ONLINE_ORDER',$6,$7,$8)`,[item.product_id,batch.id,item.storage_area_id,batch.bin_id,-take,job.order_no,`FIFO pick for ${job.job_no}`,Number(session.sub)]);
        allocations.push({batchNo:batch.batch_no,quantity:take,binId:batch.bin_id}); remaining-=take;
      }
      await client.query(`UPDATE warehouse_order_items SET picked_qty=quantity,status='PICKED' WHERE id=$1`,[itemId]);
      const left=await client.query(`SELECT COUNT(*)::int AS remaining FROM warehouse_order_items WHERE warehouse_order_id=$1 AND status<>'PICKED'`,[jobId]);
      if(Number(left.rows[0].remaining)===0) await client.query(`UPDATE warehouse_orders SET status='PICKED',updated_at=NOW() WHERE id=$1`,[jobId]);
      await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,'BARCODE_FIFO_PICK','warehouse_order_item',$2,$3::jsonb)`,[Number(session.sub),String(itemId),JSON.stringify({jobNo:job.job_no,barcode:scanned,allocations})]);
    } else if(action==='START_PACKING'){
      if(job.status!=='PICKED') throw new Error('All items must be picked before packing.');
      await client.query(`UPDATE warehouse_orders SET status='PACKING',assigned_to=$1,updated_at=NOW() WHERE id=$2`,[Number(session.sub),jobId]);
      await client.query(`UPDATE orders SET status='Processing',updated_at=NOW() WHERE id=$1`,[job.sales_order_id]);
    } else if(action==='READY_DISPATCH'){
      if(job.status!=='PACKING') throw new Error('Order must be in packing first.');
      await client.query(`UPDATE warehouse_orders SET status='READY_DISPATCH',updated_at=NOW() WHERE id=$1`,[jobId]);
      await client.query(`UPDATE orders SET status='Out for Delivery',updated_at=NOW() WHERE id=$1`,[job.sales_order_id]);
      await client.query(`INSERT INTO delivery_jobs (warehouse_order_id,status) VALUES ($1,'READY') ON CONFLICT (warehouse_order_id) DO NOTHING`,[jobId]);
    } else if(action==='DISPATCH'){
      if(job.status!=='READY_DISPATCH') throw new Error('Order must be ready for dispatch first.');
      await client.query(`UPDATE warehouse_orders SET status='OUT_FOR_DELIVERY',updated_at=NOW() WHERE id=$1`,[jobId]);
      await client.query(`UPDATE orders SET status='Out for Delivery',updated_at=NOW() WHERE id=$1`,[job.sales_order_id]);
      await client.query(`INSERT INTO delivery_jobs (warehouse_order_id,status) VALUES ($1,'OUT_FOR_DELIVERY') ON CONFLICT (warehouse_order_id) DO UPDATE SET status='OUT_FOR_DELIVERY',updated_at=NOW()`,[jobId]);
    } else throw new Error('Unsupported warehouse action.');

    if(action!=='PICK_ITEM') await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,$2,'warehouse_order',$3,$4::jsonb)`,[Number(session.sub),action,String(jobId),JSON.stringify({jobNo:job.job_no,orderNo:job.order_no})]);
    await client.query('COMMIT');
    res.status(200).json({ok:true,action});
  }catch(error){await client.query('ROLLBACK');console.error(error);res.status(400).json({error:error.message||'Could not process warehouse order.'});}
  finally{client.release();}
}
