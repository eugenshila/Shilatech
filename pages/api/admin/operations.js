import { getPool,query } from '../../../lib/db';
import { readSession } from '../../../lib/auth';
const allowed=new Set(['admin','general_manager']);
const poNo=()=>`PO-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
export default async function handler(req,res){
 const s=await readSession(req); if(!s||!allowed.has(s.role))return res.status(403).json({error:'Management access required.'});
 if(req.method==='GET')try{
  const [suppliers,pos,low,metrics,products]=await Promise.all([
   query(`SELECT * FROM suppliers WHERE active=TRUE ORDER BY name`),
   query(`SELECT po.id,po.po_no,po.status,po.expected_date,po.created_at,s.name supplier_name,COALESCE(sum(pi.quantity*pi.unit_cost_kes),0) total_cost FROM purchase_orders po LEFT JOIN suppliers s ON s.id=po.supplier_id LEFT JOIN purchase_order_items pi ON pi.purchase_order_id=po.id GROUP BY po.id,s.name ORDER BY po.created_at DESC LIMIT 50`),
   query(`SELECT id,name,brand,part_no,stock,reorder_level,reorder_quantity FROM products WHERE active=TRUE AND stock<=reorder_level ORDER BY stock ASC,name LIMIT 100`),
   query(`SELECT (SELECT count(*) FROM products WHERE active=TRUE) products,(SELECT COALESCE(sum(stock),0) FROM products WHERE active=TRUE) units,(SELECT count(*) FROM orders WHERE created_at>=date_trunc('month',now())) month_orders,(SELECT COALESCE(sum(total_kes),0) FROM (SELECT total_kes,created_at FROM orders WHERE payment_status IN ('Paid','Completed') UNION ALL SELECT total_kes,created_at FROM counter_sales UNION ALL SELECT -amount_kes total_kes,created_at FROM approved_refunds) sales WHERE created_at>=date_trunc('month',now())) month_paid_sales,(SELECT count(*) FROM returns WHERE status NOT IN ('CLOSED','RESOLVED')) open_returns`),
   query(`SELECT id,name,brand,part_no,stock,reorder_level,reorder_quantity,price_kes FROM products WHERE active=TRUE ORDER BY brand,name LIMIT 500`)
  ]);return res.json({suppliers:suppliers.rows,purchaseOrders:pos.rows,lowStock:low.rows,metrics:metrics.rows[0],products:products.rows});
 }catch(e){console.error(e);return res.status(500).json({error:'Could not load operations dashboard.'});}
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(s.role!=='admin')return res.status(403).json({error:'General manager access is read-only.'});
 const b=req.body||{}; const c=await getPool().connect();try{await c.query('BEGIN');
  if(b.action==='CREATE_SUPPLIER'){if(!b.name)throw new Error('Supplier name is required.');await c.query(`INSERT INTO suppliers(name,contact_name,phone,email,address) VALUES($1,$2,$3,$4,$5)`,[b.name,b.contactName||null,b.phone||null,b.email||null,b.address||null]);}
  else if(b.action==='CREATE_PO'){if(!b.supplierId||!Array.isArray(b.items)||!b.items.length)throw new Error('Supplier and items are required.');const p=await c.query(`INSERT INTO purchase_orders(po_no,supplier_id,status,expected_date,notes,created_by) VALUES($1,$2,'ORDERED',$3,$4,$5) RETURNING id,po_no`,[poNo(),Number(b.supplierId),b.expectedDate||null,b.notes||null,Number(s.sub)]);let valid=0;for(const i of b.items){if(Number(i.quantity)>0&&Number(i.productId)>0){valid++;await c.query(`INSERT INTO purchase_order_items(purchase_order_id,product_id,quantity,unit_cost_kes) VALUES($1,$2,$3,$4)`,[p.rows[0].id,Number(i.productId),Number(i.quantity),Number(i.unitCost)||null]);}}if(!valid)throw new Error('Add at least one purchase order item.');}
  else if(b.action==='SET_REORDER'){await c.query(`UPDATE products SET reorder_level=$1,reorder_quantity=$2,updated_at=NOW() WHERE id=$3`,[Math.max(0,Number(b.reorderLevel)||0),Math.max(1,Number(b.reorderQuantity)||1),Number(b.productId)]);}
  else throw new Error('Unknown action.');
  await c.query(`INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,$2,'operations','0',$3::jsonb)`,[Number(s.sub),b.action,JSON.stringify(b)]);await c.query('COMMIT');return res.json({ok:true});
 }catch(e){await c.query('ROLLBACK');console.error(e);return res.status(400).json({error:e.message});}finally{c.release();}
}
