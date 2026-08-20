import { query } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!requireWarehouseStaff(req,res)) return;
  try{
    const [metrics,batches,preorders,returns,products,warehouses,brandSummary,warehouseOrders]=await Promise.all([
      query(`SELECT COALESCE(SUM(available_qty),0)::int AS units_on_hand,COUNT(*) FILTER (WHERE available_qty>0)::int AS active_batches,COUNT(*) FILTER (WHERE available_qty>0 AND received_at<NOW()-INTERVAL '180 days')::int AS aged_batches FROM inventory_batches`),
      query(`SELECT b.id,b.batch_no,b.received_qty,b.available_qty,b.received_at,b.supplier_name,p.id AS product_id,p.part_no,p.name,p.brand,p.barcode,w.name AS warehouse,w.code AS warehouse_code,w.brand_code,wb.code AS bin_code FROM inventory_batches b JOIN products p ON p.id=b.product_id JOIN warehouses w ON w.id=b.warehouse_id LEFT JOIN warehouse_bins wb ON wb.id=b.bin_id ORDER BY p.brand,b.received_at ASC LIMIT 150`),
      query(`SELECT pr.id,pr.quantity,pr.allocated_qty,pr.expected_at,pr.status,pr.customer_name,p.part_no,p.name FROM preorders pr JOIN products p ON p.id=pr.product_id WHERE pr.status NOT IN ('FULFILLED','CANCELLED') ORDER BY pr.created_at ASC LIMIT 50`),
      query(`SELECT r.id,r.return_no,r.quantity,r.reason,r.defect_type,r.disposition,r.status,r.created_at,p.part_no,p.name,p.brand FROM returns r JOIN products p ON p.id=r.product_id WHERE r.status<>'CLOSED' ORDER BY r.created_at DESC LIMIT 50`),
      query(`SELECT id,part_no,name,brand,stock,barcode FROM products WHERE active=TRUE ORDER BY brand,name LIMIT 300`),
      query(`SELECT id,code,name,address,brand_code,storage_type FROM warehouses WHERE active=TRUE ORDER BY CASE WHEN storage_type='BRAND' THEN 0 ELSE 1 END,name`),
      query(`SELECT w.id,w.code,w.name,w.brand_code,COALESCE(SUM(b.available_qty),0)::int AS units_on_hand,COUNT(b.id) FILTER (WHERE b.available_qty>0)::int AS active_batches FROM warehouses w LEFT JOIN inventory_batches b ON b.warehouse_id=w.id WHERE w.active=TRUE AND w.storage_type='BRAND' GROUP BY w.id,w.code,w.name,w.brand_code ORDER BY w.name`),
      query(`SELECT wo.id,wo.job_no,wo.status,wo.priority,wo.created_at,o.order_no,o.customer_name,o.phone,o.delivery_zone,o.total_kes,o.payment_method,o.payment_status,
        COALESCE(json_agg(json_build_object('id',wi.id,'brand',wi.brand,'partNo',wi.part_no,'name',wi.name,'quantity',wi.quantity,'pickedQty',wi.picked_qty,'status',wi.status,'storageArea',w.name) ORDER BY wi.id) FILTER (WHERE wi.id IS NOT NULL),'[]'::json) AS items
        FROM warehouse_orders wo JOIN orders o ON o.id=wo.order_id LEFT JOIN warehouse_order_items wi ON wi.warehouse_order_id=wo.id LEFT JOIN warehouses w ON w.id=wi.storage_area_id
        WHERE wo.status NOT IN ('COMPLETED','CANCELLED') GROUP BY wo.id,o.id ORDER BY wo.created_at ASC LIMIT 50`)
    ]);
    res.status(200).json({metrics:metrics.rows[0],batches:batches.rows,preorders:preorders.rows,returns:returns.rows,products:products.rows,warehouses:warehouses.rows,brandSummary:brandSummary.rows,warehouseOrders:warehouseOrders.rows});
  }catch(error){console.error(error);res.status(500).json({error:'Could not load warehouse dashboard.'});}
}
