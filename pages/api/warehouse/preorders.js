import { query } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

export default async function handler(req,res){
  const session=requireWarehouseStaff(req,res,['warehouse_manager','warehouse_clerk','finance']);
  if(!session) return;
  try{
    if(req.method==='POST'){
      const productId=Number(req.body?.productId);
      const quantity=Number(req.body?.quantity);
      const customerName=String(req.body?.customerName||'').trim();
      const phone=String(req.body?.phone||'').trim()||null;
      const email=String(req.body?.email||'').trim().toLowerCase()||null;
      const expectedAt=req.body?.expectedAt||null;
      const notes=String(req.body?.notes||'').trim()||null;
      if(!Number.isInteger(productId)||!Number.isInteger(quantity)||quantity<=0||!customerName) return res.status(400).json({error:'Product, customer name and positive quantity are required.'});
      const result=await query(`INSERT INTO preorders (product_id,customer_name,phone,email,quantity,expected_at,notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[productId,customerName,phone,email,quantity,expectedAt,notes]);
      await query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,'CREATE_PREORDER','preorder',$2,$3::jsonb)`,[Number(session.sub),String(result.rows[0].id),JSON.stringify({productId,quantity,customerName})]);
      return res.status(201).json({preorder:result.rows[0]});
    }
    if(req.method==='GET'){
      const result=await query(`SELECT pr.*,p.part_no,p.name,p.brand FROM preorders pr JOIN products p ON p.id=pr.product_id ORDER BY pr.created_at DESC LIMIT 200`);
      return res.status(200).json({preorders:result.rows});
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(error){console.error(error);res.status(400).json({error:error.message||'Could not process preorder.'});}
}
