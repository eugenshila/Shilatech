import { getPool } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

const allowedBrands=new Set(['Jeep','Mercedes-Benz','Volkswagen','Range Rover','Volvo','Ford']);
const allowedCategories=new Set(['Engine','Brakes','Suspension','Electrical','Body','Interior','Cooling','Transmission','Filters','Steering','Other']);
const slugify=value=>String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
const clean=value=>String(value??'').trim();
const integer=(value,label,row,{min=0,optional=false}={})=>{
  if(optional&&clean(value)==='') return null;
  const parsed=Number(value);
  if(!Number.isInteger(parsed)||parsed<min) throw new Error(`Row ${row}: ${label} must be a whole number of at least ${min}.`);
  return parsed;
};

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const session=await requireWarehouseStaff(req,res,['warehouse_manager','warehouse_clerk']);
  if(!session) return;
  const rows=Array.isArray(req.body?.rows)?req.body.rows:[];
  if(!rows.length||rows.length>500) return res.status(400).json({error:'Provide between 1 and 500 CSV rows.'});

  const pool=getPool();
  const client=await pool.connect();
  let createdProducts=0;
  try{
    await client.query('BEGIN');
    const warehouses=await client.query(`SELECT id,code,name,brand_code FROM warehouses WHERE active=TRUE AND storage_type='BRAND'`);
    const warehouseByBrand=new Map(warehouses.rows.map(w=>[w.brand_code,w]));

    for(let index=0;index<rows.length;index++){
      const source=rows[index]||{};
      const row=Number(source._row)||index+2;
      const partNo=clean(source.part_no).toUpperCase();
      const name=clean(source.name);
      const brand=clean(source.brand);
      const category=clean(source.category);
      const partType=clean(source.part_type)||'Aftermarket';
      const priceKes=integer(source.price_kes,'price_kes',row,{min:0});
      const quantity=integer(source.quantity,'quantity',row,{min:1});
      const unitCostKes=integer(source.unit_cost_kes,'unit_cost_kes',row,{min:0,optional:true});
      const batchNo=clean(source.batch_no);
      const binCode=clean(source.bin_code)||null;
      if(!partNo||!name||!batchNo) throw new Error(`Row ${row}: part_no, name and batch_no are required.`);
      if(!allowedBrands.has(brand)) throw new Error(`Row ${row}: unsupported brand "${brand}".`);
      if(!allowedCategories.has(category)) throw new Error(`Row ${row}: unsupported category "${category}".`);
      const warehouse=warehouseByBrand.get(brand);
      if(!warehouse) throw new Error(`Row ${row}: the ${brand} warehouse is not configured.`);

      let product=await client.query(`SELECT id,brand,part_no,name FROM products WHERE UPPER(part_no)=UPPER($1) LIMIT 1 FOR UPDATE`,[partNo]);
      let productId;
      if(product.rowCount){
        if(product.rows[0].brand!==brand) throw new Error(`Row ${row}: ${partNo} already belongs to ${product.rows[0].brand}.`);
        productId=Number(product.rows[0].id);
      }else{
        let slug=slugify(`${brand}-${name}-${partNo}`)||slugify(partNo);
        const slugExists=await client.query(`SELECT 1 FROM products WHERE slug=$1`,[slug]);
        if(slugExists.rowCount) slug=`${slug}-${index+1}-${Date.now().toString(36)}`;
        const models=clean(source.models).split(',').map(x=>x.trim()).filter(Boolean);
        const created=await client.query(`INSERT INTO products
          (slug,name,brand,category,part_no,part_type,price_kes,stock,years,models,engine,image_url,barcode,active)
          VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9::jsonb,$10,$11,$5,TRUE) RETURNING id`,
          [slug,name,brand,category,partNo,partType,priceKes,clean(source.years)||null,JSON.stringify(models),clean(source.engine)||null,clean(source.image_url)||null]);
        productId=Number(created.rows[0].id);createdProducts++;
      }

      let binId=null;
      if(binCode){const bin=await client.query(`INSERT INTO warehouse_bins (warehouse_id,code,zone) VALUES ($1,$2,$3) ON CONFLICT (warehouse_id,code) DO UPDATE SET active=TRUE,zone=EXCLUDED.zone RETURNING id`,[warehouse.id,binCode,brand]);binId=bin.rows[0].id;}
      const batch=await client.query(`INSERT INTO inventory_batches (product_id,warehouse_id,bin_id,batch_no,supplier_name,supplier_ref,received_qty,available_qty,unit_cost_kes,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9) RETURNING id`,[productId,warehouse.id,binId,batchNo,clean(source.supplier_name)||null,clean(source.supplier_ref)||null,quantity,unitCostKes,Number(session.sub)]);
      await client.query(`INSERT INTO inventory_movements (product_id,batch_id,warehouse_id,bin_id,movement_type,quantity,reference_type,reference_id,notes,created_by) VALUES ($1,$2,$3,$4,'RECEIPT',$5,'CSV_IMPORT',$6,$7,$8)`,[productId,batch.rows[0].id,warehouse.id,binId,quantity,batchNo,`CSV receipt into ${warehouse.name}`,Number(session.sub)]);
      await client.query(`UPDATE products SET stock=stock+$1,barcode=COALESCE(barcode,part_no),active=TRUE,updated_at=NOW() WHERE id=$2`,[quantity,productId]);
    }
    await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,'CSV_IMPORT','inventory_batch','bulk',$2::jsonb)`,[Number(session.sub),JSON.stringify({rows:rows.length,createdProducts})]);
    await client.query('COMMIT');
    return res.status(201).json({imported:rows.length,createdProducts});
  }catch(error){
    await client.query('ROLLBACK');console.error(error);
    if(error.code==='23505') return res.status(409).json({error:'A part number, product slug or batch number in the CSV already exists.'});
    return res.status(400).json({error:error.message||'Could not import CSV.'});
  }finally{client.release();}
}
