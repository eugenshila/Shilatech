import { getPool } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = requireWarehouseStaff(req, res, ['warehouse_manager','warehouse_clerk']);
  if (!session) return;

  const productId = Number(req.body?.productId);
  const warehouseId = Number(req.body?.warehouseId);
  const quantity = Number(req.body?.quantity);
  const batchNo = String(req.body?.batchNo || '').trim();
  const supplierName = String(req.body?.supplierName || '').trim() || null;
  const supplierRef = String(req.body?.supplierRef || '').trim() || null;
  const binCode = String(req.body?.binCode || '').trim() || null;
  const unitCostKes = req.body?.unitCostKes === '' || req.body?.unitCostKes == null ? null : Number(req.body.unitCostKes);

  if (!Number.isInteger(productId) || !Number.isInteger(warehouseId) || !Number.isInteger(quantity) || quantity <= 0 || !batchNo) {
    return res.status(400).json({ error: 'Product, warehouse, batch number and positive quantity are required.' });
  }
  if (unitCostKes != null && (!Number.isInteger(unitCostKes) || unitCostKes < 0)) {
    return res.status(400).json({ error: 'Unit cost must be a non-negative whole KSh amount.' });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const product = await client.query(`SELECT id,part_no,name,barcode FROM products WHERE id=$1 AND active=TRUE FOR UPDATE`, [productId]);
    if (!product.rowCount) throw new Error('Product not found.');

    let binId = null;
    if (binCode) {
      const bin = await client.query(`INSERT INTO warehouse_bins (warehouse_id,code) VALUES ($1,$2)
        ON CONFLICT (warehouse_id,code) DO UPDATE SET active=TRUE RETURNING id`, [warehouseId, binCode]);
      binId = bin.rows[0].id;
    }

    const batch = await client.query(`INSERT INTO inventory_batches
      (product_id,warehouse_id,bin_id,batch_no,supplier_name,supplier_ref,received_qty,available_qty,unit_cost_kes,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9)
      RETURNING *`, [productId,warehouseId,binId,batchNo,supplierName,supplierRef,quantity,unitCostKes,Number(session.sub)]);

    await client.query(`INSERT INTO inventory_movements
      (product_id,batch_id,warehouse_id,bin_id,movement_type,quantity,reference_type,reference_id,notes,created_by)
      VALUES ($1,$2,$3,$4,'RECEIPT',$5,'BATCH',$6,$7,$8)`,
      [productId,batch.rows[0].id,warehouseId,binId,quantity,batchNo,`Received${supplierName ? ` from ${supplierName}` : ''}`,Number(session.sub)]);

    await client.query(`UPDATE products SET stock=stock+$1,barcode=COALESCE(barcode,part_no),updated_at=NOW() WHERE id=$2`, [quantity,productId]);
    await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details)
      VALUES ($1,'RECEIVE_STOCK','inventory_batch',$2,$3::jsonb)`, [Number(session.sub),String(batch.rows[0].id),JSON.stringify({ productId, quantity, batchNo, warehouseId, binCode })]);

    await client.query('COMMIT');
    res.status(201).json({ batch: batch.rows[0], barcode: product.rows[0].barcode || product.rows[0].part_no });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') return res.status(409).json({ error: 'That batch number already exists for this product and warehouse.' });
    res.status(400).json({ error: error.message || 'Could not receive stock.' });
  } finally {
    client.release();
  }
}
