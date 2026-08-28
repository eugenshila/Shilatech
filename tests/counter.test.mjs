import { test,before,after,beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { normalizeItems,createCounterSale,requireCounterUser,assertStock } from '../lib/counter.mjs';
import { cancelUnpickedOrder } from '../lib/cancel-order.mjs';
import { staffDestination } from '../lib/staff-access.mjs';

let db,client,user;
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
before(async()=>{
 db=new PGlite();
 client={query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows||r.rows.length};}};
 for(const path of ['../scripts/migrate.mjs','../scripts/migrate-fulfillment.mjs']){
  const source=await read(path);await db.exec(source.match(/const schema\s*=\s*`([\s\S]*?)`;/)[1]);
 }
 await db.exec(await read('../scripts/locations-pos.sql'));
 await db.exec(await read('../scripts/locations-pos.sql'));
});
after(async()=>{await db?.close();});
beforeEach(async()=>{
 await db.exec(`TRUNCATE customers,products,warehouses RESTART IDENTITY CASCADE;
 INSERT INTO customers(name,email,password_hash,role,location_id) VALUES('Test cashier','cashier@example.invalid','test','cashier',main_business_location_id());
 INSERT INTO warehouses(code,name,brand_code,storage_type) VALUES('JEEP','Jeep area','Jeep','BRAND');
 INSERT INTO products(slug,name,brand,category,part_no,price_kes,stock) VALUES('pads','Brake pads','Jeep','Brakes','PAD-1',100,10);
 INSERT INTO inventory_batches(product_id,warehouse_id,batch_no,received_qty,available_qty,unit_cost_kes,received_at) VALUES(1,1,'OLD',4,4,40,NOW()-INTERVAL '1 day'),(1,1,'NEW',6,6,50,NOW());`);
 user=await requireCounterUser(client,1);
});
async function transact(fn){await client.query('BEGIN');try{const r=await fn();await client.query('COMMIT');return r;}catch(e){await client.query('ROLLBACK');throw e;}}
const body=(extra={})=>({requestKey:randomUUID(),items:[{id:1,quantity:5}],paymentMethod:'Cash',tenderedKes:600,expectedTotalKes:(extra.items||[{quantity:5}]).reduce((n,i)=>n+i.quantity*100,0),...extra});
const sell=b=>transact(()=>createCounterSale(client,user,b));
async function reserve(quantity=3){
 await db.exec(`INSERT INTO orders(order_no,customer_name,email,phone,delivery_address,subtotal_kes,total_kes,payment_method) VALUES('ONLINE-1','Test','test@example.invalid','0','Test',300,300,'Cash');
 INSERT INTO order_items(order_id,product_id,part_no,name,quantity,unit_price_kes,line_total_kes) VALUES(1,1,'PAD-1','Brake pads',${quantity},100,${quantity*100});
 INSERT INTO warehouse_orders(order_id,job_no) VALUES(1,'WH-1');
 INSERT INTO warehouse_order_items(warehouse_order_id,order_item_id,product_id,storage_area_id,brand,part_no,name,quantity) VALUES(1,1,1,1,'Jeep','PAD-1','Brake pads',${quantity});
 UPDATE products SET stock=stock-${quantity} WHERE id=1;`);
}

test('duplicate lines aggregate; invalid quantities and identifiers fail',()=>{
 assert.deepEqual(normalizeItems([{id:2,quantity:1},{id:1,quantity:2},{id:1,quantity:3}]),[{id:1,quantity:5},{id:2,quantity:1}]);
 for(const quantity of [0,-1,1.5,NaN,Infinity,100001])assert.throws(()=>normalizeItems([{id:1,quantity}]));
 assert.throws(()=>normalizeItems([{id:0,quantity:1}]));
 assert.throws(()=>normalizeItems([]));
});
test('staff login sends each role to authorised local tools only',()=>{
 assert.equal(staffDestination('cashier','/pos'),'/pos');
 assert.equal(staffDestination('admin','/operations'),'/operations');
 assert.equal(staffDestination('warehouse_clerk','/pos'),'/warehouse');
 assert.equal(staffDestination('delivery_driver','/pos'),'/delivery');
 for(const role of ['customer','unknown','toString','__proto__',undefined])assert.equal(staffDestination(role,'/pos'),null);
 for(const next of ['https://example.com','//example.com','/admin','/pos?next=https://example.com',['/pos']])assert.equal(staffDestination('cashier',next),'/pos');
});
test('cash sale records payment, FIFO costs, movements, and exact change',async()=>{
 const r=await sell(body());assert.equal(r.total_kes,500);assert.equal(r.change_kes,100);assert.equal(r.items.length,1);
 const batches=(await client.query('SELECT available_qty FROM inventory_batches ORDER BY id')).rows;
 assert.deepEqual(batches.map(b=>b.available_qty),[0,5]);
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,5);
 assert.equal((await client.query('SELECT COUNT(*)::int n FROM inventory_movements')).rows[0].n,2);
 assert.deepEqual((await client.query('SELECT quantity,unit_cost_kes FROM counter_sale_allocations ORDER BY batch_id')).rows,[{quantity:4,unit_cost_kes:40},{quantity:1,unit_cost_kes:50}]);
});
test('retry returns the same receipt without deducting stock again',async()=>{
 const b=body();const a=await sell(b),r=await sell(b);assert.equal(a.id,r.id);
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,5);
 await assert.rejects(sell({...b,tenderedKes:700}),/different sale/);
});
test('online reservations remain protected after a counter sale',async()=>{
 await reserve(3);
 await assert.rejects(sell(body({items:[{id:1,quantity:8}],tenderedKes:800})),/Insufficient/);
 await sell(body({items:[{id:1,quantity:7}],tenderedKes:700}));
 const s=(await client.query('SELECT * FROM location_stock WHERE product_id=1 AND location_id=$1',[user.location_id])).rows[0];
 assert.equal(Number(s.physical_qty),3);assert.equal(Number(s.reserved_qty),3);assert.equal(Number(s.available_qty),0);
});
test('stock discrepancy blocks sale without writing payment or inventory',async()=>{
 await client.query('UPDATE products SET stock=9');
 await assert.rejects(sell(body()),/reconciliation/);
 assert.equal((await client.query('SELECT COUNT(*)::int n FROM counter_sales')).rows[0].n,0);
 assert.equal(Number((await client.query('SELECT SUM(available_qty) n FROM inventory_batches')).rows[0].n),10);
});
test('payment validation and duplicate electronic reference roll back',async()=>{
 await assert.rejects(sell(body({tenderedKes:400})),/must cover/);
 await assert.rejects(sell(body({paymentMethod:'M-Pesa',paymentReference:'',tenderedKes:500})),/reference/);
 await assert.rejects(sell(body({paymentMethod:'Card',paymentReference:'CARD-1',tenderedKes:600})),/exactly/);
 await sell(body({paymentMethod:'M-Pesa',paymentReference:'REF-1',tenderedKes:500}));
 await assert.rejects(sell(body({paymentMethod:'M-Pesa',paymentReference:'ref-1',tenderedKes:500})),/unique/);
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,5);
});
test('server prices override client prices; inactive parts fail',async()=>{
 await assert.rejects(sell(body({expectedTotalKes:1})),/price changed/);
 const r=await sell(body({items:[{id:1,quantity:1,priceKes:1}],tenderedKes:100}));assert.equal(r.total_kes,100);
 await client.query('UPDATE products SET active=FALSE');await assert.rejects(sell(body()),/no longer available/);
});
test('database role changes revoke cashier access; unassigned and branch staff are blocked',async()=>{
 await client.query("UPDATE customers SET role='customer' WHERE id=1");await assert.rejects(requireCounterUser(client,1),/denied/);
 await client.query("UPDATE customers SET role='cashier',location_id=NULL WHERE id=1");await assert.rejects(requireCounterUser(client,1),/assignment/);
 await db.exec("INSERT INTO business_locations(code,name) VALUES('BRANCH-TEST','Future branch'); UPDATE customers SET location_id=(SELECT id FROM business_locations WHERE code='BRANCH-TEST') WHERE id=1;");
 await assert.rejects(requireCounterUser(client,1),/Branch counters/);
 await assert.rejects(client.query("UPDATE business_locations SET active=TRUE WHERE code='BRANCH-TEST'"),/check constraint/);
});
test('cancelling an unpicked order releases its reservation exactly once',async()=>{
 await reserve();await transact(()=>cancelUnpickedOrder(client,1));await transact(()=>cancelUnpickedOrder(client,1));
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,10);
 assert.equal(Number((await client.query('SELECT reserved_qty FROM location_stock WHERE location_id=$1',[user.location_id])).rows[0].reserved_qty),0);
});
test('picked orders cannot restore stock through cancellation',async()=>{
 await reserve();await client.query('UPDATE warehouse_order_items SET picked_qty=1');
 await assert.rejects(transact(()=>cancelUnpickedOrder(client,1)),/managed return/);
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,7);
});
test('pending orders without a storage area block stock use',async()=>{
 await reserve();await client.query('UPDATE warehouse_order_items SET storage_area_id=NULL');
 await assert.rejects(sell(body()),/no storage area/);
});
test('migration backfills legacy locations and remains repeatable',async()=>{
 await client.query('UPDATE customers SET location_id=NULL');await reserve();await client.query('UPDATE orders SET location_id=NULL');
 await db.exec(await read('../scripts/locations-pos.sql'));
 assert.equal(String((await client.query('SELECT location_id FROM customers')).rows[0].location_id),String(user.location_id));
 assert.equal(String((await client.query('SELECT location_id FROM orders')).rows[0].location_id),String(user.location_id));
 const p=(await client.query('SELECT * FROM products WHERE id=1')).rows[0];await assertStock(client,p,user.location_id,7);
});

async function sampleCatalogue(){
 const seeds=[['06H121026DD',6],['06H905115B',24],['31317603',7],['52060398AC',8],['68212327AA',9],['A2048300018',15],['A2711800109',18],['LR061888',4]];
 for(const [part,stock] of seeds)await client.query("INSERT INTO products(slug,name,brand,category,part_no,price_kes,stock) VALUES($1,$1,'Jeep','Other',$1,100,$2)",[part,stock]);
}
test('confirmed sample correction clears only eight sample balances and is one-time',async()=>{
 await sampleCatalogue();const sql=await read('../scripts/clear-confirmed-sample-stock.sql');await db.exec(sql);
 assert.equal((await client.query("SELECT COUNT(*)::int n FROM products WHERE part_no<>'PAD-1' AND stock=0")).rows[0].n,8);
 assert.equal((await client.query("SELECT stock FROM products WHERE part_no='PAD-1'")).rows[0].stock,10);
 await client.query("UPDATE products SET stock=3 WHERE part_no='06H121026DD'");await db.exec(sql);
 assert.equal((await client.query("SELECT stock FROM products WHERE part_no='06H121026DD'")).rows[0].stock,3);
 assert.equal((await client.query("SELECT COUNT(*)::int n FROM warehouse_audit WHERE action='CLEAR_CONFIRMED_SAMPLE_STOCK'")).rows[0].n,1);
});
test('sample correction refuses changed balances and rolls back all changes',async()=>{
 await sampleCatalogue();await client.query("UPDATE products SET stock=5 WHERE part_no='LR061888'");
 await assert.rejects(db.exec(await read('../scripts/clear-confirmed-sample-stock.sql')),/has changed/);await client.query('ROLLBACK');
 assert.equal((await client.query("SELECT stock FROM products WHERE part_no='06H121026DD'")).rows[0].stock,6);
});
test('sample correction refuses warehouse history',async()=>{
 await sampleCatalogue();await client.query("INSERT INTO inventory_batches(product_id,warehouse_id,batch_no,received_qty,available_qty) SELECT id,1,'REAL',6,6 FROM products WHERE part_no='06H121026DD'");
 await assert.rejects(db.exec(await read('../scripts/clear-confirmed-sample-stock.sql')),/history/);await client.query('ROLLBACK');
 assert.equal((await client.query("SELECT stock FROM products WHERE part_no='06H121026DD'")).rows[0].stock,6);
});
