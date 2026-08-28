import { getPool } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

function slugify(value){
  return String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = await requireWarehouseStaff(req, res, ['warehouse_manager','warehouse_clerk']);
  if (!session) return;

  const createNew = Boolean(req.body?.createNew);
  let productId = Number(req.body?.productId);
  const warehouseId = Number(req.body?.warehouseId);
  const quantity = Number(req.body?.quantity);
  const batchNo = String(req.body?.batchNo || '').trim();
  const supplierName = String(req.body?.supplierName || '').trim() || null;
  const supplierRef = String(req.body?.supplierRef || '').trim() || null;
  const binCode = String(req.body?.binCode || '').trim() || null;
  const unitCostKes = req.body?.unitCostKes === '' || req.body?.unitCostKes == null ? null : Number(req.body.unitCostKes);

  if (!Number.isInteger(warehouseId) || !Number.isInteger(quantity) || quantity <= 0 || !batchNo) {
    return res.status(400).json({ error: 'Storage area, batch number and positive quantity are required.' });
  }
  if (unitCostKes != null && (!Number.isInteger(unitCostKes) || unitCostKes < 0)) {
    return res.status(400).json({ error: 'Unit cost must be a non-negative whole KSh amount.' });
  }

  const newPart = req.body?.newPart || {};
  const newName = String(newPart.name || '').trim();
  const newBrand = String(newPart.brand || '').trim();
  const newCategory = String(newPart.category || '').trim();
  const newPartNo = String(newPart.partNo || '').trim().toUpperCase();
  const newType = String(newPart.partType || 'Aftermarket').trim();
  const newPrice = Number(newPart.priceKes);
  const newYears = String(newPart.years || '').trim() || null;
  const newEngine = String(newPart.engine || '').trim() || null;
  const newImageUrl = String(newPart.imageUrl || '').trim() || null;
  const newModels = String(newPart.models || '').split(',').map(x=>x.trim()).filter(Boolean);

  if (createNew) {
    if (!newName || !newBrand || !newCategory || !newPartNo || !Number.isInteger(newPrice) || newPrice < 0) {
      return res.status(400).json({ error: 'New part name, brand, category, part number and selling price are required.' });
    }
  } else if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: 'Select an existing product or choose Create New Part.' });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (createNew) {
      const duplicate = await client.query(`SELECT id FROM products WHERE UPPER(part_no)=UPPER($1) LIMIT 1`, [newPartNo]);
      if (duplicate.rowCount) throw new Error('That part number already exists. Select the existing part instead.');
      let slug = slugify(`${newBrand}-${newName}-${newPartNo}`) || slugify(newPartNo);
      const slugCheck = await client.query(`SELECT id FROM products WHERE slug=$1 LIMIT 1`, [slug]);
      if (slugCheck.rowCount) slug = `${slug}-${Date.now().toString(36)}`;
      const created = await client.query(`INSERT INTO products
        (slug,name,brand,category,part_no,part_type,price_kes,stock,years,models,engine,image_url,barcode,active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9::jsonb,$10,$11,$5,TRUE)
        RETURNING id`, [slug,newName,newBrand,newCategory,newPartNo,newType,newPrice,newYears,JSON.stringify(newModels),newEngine,newImageUrl]);
      productId = Number(created.rows[0].id);
    }

    const product = await client.query(`SELECT id,part_no,name,brand,barcode FROM products WHERE id=$1 AND active=TRUE FOR UPDATE`, [productId]);
    if (!product.rowCount) throw new Error('Product not found.');

    const warehouse = await client.query(`SELECT id,code,name,brand_code,storage_type FROM warehouses WHERE id=$1 AND active=TRUE`, [warehouseId]);
    if (!warehouse.rowCount) throw new Error('Storage area not found.');
    const w = warehouse.rows[0];
    const p = product.rows[0];
    if (session.assignedBrand && p.brand !== session.assignedBrand) throw new Error(`This account is assigned to ${session.assignedBrand} only.`);
    if (w.storage_type !== 'BRAND') throw new Error('Sellable stock cannot be received into the quarantine area.');
    if (w.brand_code !== p.brand) throw new Error(`${p.brand} parts must be received into the ${p.brand} storage area. This prevents brands from being mixed.`);

    let binId = null;
    if (binCode) {
      const bin = await client.query(`INSERT INTO warehouse_bins (warehouse_id,code,zone) VALUES ($1,$2,$3)
        ON CONFLICT (warehouse_id,code) DO UPDATE SET active=TRUE,zone=EXCLUDED.zone RETURNING id`, [warehouseId, binCode, p.brand]);
      binId = bin.rows[0].id;
    }

    const batch = await client.query(`INSERT INTO inventory_batches
      (product_id,warehouse_id,bin_id,batch_no,supplier_name,supplier_ref,received_qty,available_qty,unit_cost_kes,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9)
      RETURNING *`, [productId,warehouseId,binId,batchNo,supplierName,supplierRef,quantity,unitCostKes,Number(session.sub)]);

    await client.query(`INSERT INTO inventory_movements
      (product_id,batch_id,warehouse_id,bin_id,movement_type,quantity,reference_type,reference_id,notes,created_by)
      VALUES ($1,$2,$3,$4,'RECEIPT',$5,'BATCH',$6,$7,$8)`,
      [productId,batch.rows[0].id,warehouseId,binId,quantity,batchNo,`Received into ${w.name}${supplierName ? ` from ${supplierName}` : ''}`,Number(session.sub)]);

    await client.query(`UPDATE products SET stock=stock+$1,barcode=COALESCE(barcode,part_no),active=TRUE,updated_at=NOW() WHERE id=$2`, [quantity,productId]);
    await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details)
      VALUES ($1,$2,'inventory_batch',$3,$4::jsonb)`, [Number(session.sub),createNew?'CREATE_PART_AND_RECEIVE':'RECEIVE_STOCK',String(batch.rows[0].id),JSON.stringify({ productId, brand:p.brand, partNo:p.part_no, quantity, batchNo, warehouseId, warehouseCode:w.code, binCode, publishedOnline:true })]);

    await client.query('COMMIT');
    res.status(201).json({ batch: batch.rows[0], productId, createdProduct:createNew, publishedOnline:true, barcode: p.barcode || p.part_no, storageArea: w });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') return res.status(409).json({ error: 'That part number, product slug or batch already exists.' });
    res.status(400).json({ error: error.message || 'Could not receive stock.' });
  } finally {
    client.release();
  }
}
