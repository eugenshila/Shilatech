import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false});
try{
 const r=await pool.query(`SELECT p.part_no,p.name,p.stock AS website_available,s.physical_qty,s.reserved_qty,s.available_qty AS expected_available
 FROM products p JOIN location_stock s ON s.product_id=p.id JOIN business_locations l ON l.id=s.location_id
 WHERE l.code='MAIN' AND (p.stock<>s.available_qty OR s.reserved_qty>s.physical_qty) ORDER BY p.part_no`);
 console.table(r.rows);
 const unassigned=await pool.query(`SELECT wi.id,wi.part_no FROM warehouse_order_items wi JOIN warehouse_orders wo ON wo.id=wi.warehouse_order_id WHERE wi.storage_area_id IS NULL AND wi.picked_qty<wi.quantity AND wo.status<>'CANCELLED'`);
 if(unassigned.rowCount){console.log('Unassigned pending order lines:');console.table(unassigned.rows);}
 console.log(`${r.rowCount} stock discrepancies; ${unassigned.rowCount} unassigned pending lines. No data was changed.`);
 if(r.rowCount||unassigned.rowCount)process.exitCode=1;
}finally{await pool.end();}
