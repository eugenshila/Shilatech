import { query } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireWarehouseStaff(req, res)) return;
  try {
    const [metrics, batches, preorders, returns, products, warehouses] = await Promise.all([
      query(`SELECT
        COALESCE(SUM(available_qty),0)::int AS units_on_hand,
        COUNT(*) FILTER (WHERE available_qty > 0)::int AS active_batches,
        COUNT(*) FILTER (WHERE available_qty > 0 AND received_at < NOW() - INTERVAL '180 days')::int AS aged_batches
        FROM inventory_batches`),
      query(`SELECT b.id,b.batch_no,b.received_qty,b.available_qty,b.received_at,b.supplier_name,
        p.id AS product_id,p.part_no,p.name,p.brand,p.barcode,w.name AS warehouse,wb.code AS bin_code
        FROM inventory_batches b JOIN products p ON p.id=b.product_id
        JOIN warehouses w ON w.id=b.warehouse_id LEFT JOIN warehouse_bins wb ON wb.id=b.bin_id
        ORDER BY b.received_at ASC LIMIT 100`),
      query(`SELECT pr.id,pr.quantity,pr.allocated_qty,pr.expected_at,pr.status,pr.customer_name,p.part_no,p.name
        FROM preorders pr JOIN products p ON p.id=pr.product_id WHERE pr.status NOT IN ('FULFILLED','CANCELLED')
        ORDER BY pr.created_at ASC LIMIT 50`),
      query(`SELECT r.id,r.return_no,r.quantity,r.reason,r.defect_type,r.disposition,r.status,r.created_at,p.part_no,p.name
        FROM returns r JOIN products p ON p.id=r.product_id WHERE r.status <> 'CLOSED'
        ORDER BY r.created_at DESC LIMIT 50`),
      query(`SELECT id,part_no,name,brand,stock,barcode FROM products WHERE active=TRUE ORDER BY brand,name LIMIT 300`),
      query(`SELECT id,code,name,address FROM warehouses WHERE active=TRUE ORDER BY name`)
    ]);
    res.status(200).json({ metrics: metrics.rows[0], batches: batches.rows, preorders: preorders.rows, returns: returns.rows, products: products.rows, warehouses: warehouses.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load warehouse dashboard.' });
  }
}
