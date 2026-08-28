import { query } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

function returnNo(){return `RET-${Date.now().toString(36).toUpperCase()}`;}

export default async function handler(req,res){
  const session=await requireWarehouseStaff(req,res,['warehouse_manager','warehouse_clerk','dispatch']);
  if(!session) return;
  try{
    if(req.method==='POST'){
      const productId=Number(req.body?.productId);
      const orderId=req.body?.orderId?Number(req.body.orderId):null;
      const batchId=req.body?.batchId?Number(req.body.batchId):null;
      const quantity=Number(req.body?.quantity);
      const reason=String(req.body?.reason||'').trim();
      const defectType=String(req.body?.defectType||'').trim()||null;
      const disposition=String(req.body?.disposition||'QUARANTINE').trim().toUpperCase();
      const notes=String(req.body?.notes||'').trim()||null;
      if(!Number.isInteger(productId)||!Number.isInteger(quantity)||quantity<=0||!reason) return res.status(400).json({error:'Product, quantity and return reason are required.'});
      const product=await query(`SELECT brand FROM products WHERE id=$1`,[productId]);
      if(!product.rowCount) return res.status(404).json({error:'Product not found.'});
      if(session.assignedBrand && product.rows[0].brand!==session.assignedBrand) return res.status(403).json({error:`This account is assigned to ${session.assignedBrand} only.`});
      const no=returnNo();
      const result=await query(`INSERT INTO returns (return_no,product_id,order_id,batch_id,quantity,reason,defect_type,disposition,notes,reported_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[no,productId,orderId,batchId,quantity,reason,defectType,disposition,notes,Number(session.sub)]);
      await query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,'CREATE_RETURN','return',$2,$3::jsonb)`,[Number(session.sub),String(result.rows[0].id),JSON.stringify({productId,quantity,reason,defectType,disposition})]);
      return res.status(201).json({return:result.rows[0]});
    }
    if(req.method==='GET'){
      const result=await query(`SELECT r.*,p.part_no,p.name,p.brand FROM returns r JOIN products p ON p.id=r.product_id ORDER BY r.created_at DESC LIMIT 200`);
      return res.status(200).json({returns:result.rows});
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(error){console.error(error);res.status(400).json({error:error.message||'Could not process return.'});}
}
