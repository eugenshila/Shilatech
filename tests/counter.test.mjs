import { test,before,after,beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { normalizeItems,createCounterSale,requireCounterUser,assertStock } from '../lib/counter.mjs';
import { cancelUnpickedOrder } from '../lib/cancel-order.mjs';
import { staffDestination,canViewStaffPage } from '../lib/staff-access.mjs';
import { createRequest,decideRequest,recordRefundPayout } from '../lib/approvals.mjs';
import { saveGarageJob } from '../lib/garage-jobs.mjs';

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
 await db.exec(await read('../scripts/staff-workflows.sql'));
 await db.exec(await read('../scripts/staff-workflows.sql'));
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

async function team(){
 for(const [name,role] of [['Manager','general_manager'],['Administrator','admin'],['Mechanic','garage_staff'],['Receiver','warehouse_clerk']])await client.query('INSERT INTO customers(name,email,password_hash,role,location_id) VALUES($1,$2,$3,$4,main_business_location_id())',[name,name+'@example.invalid','test',role]);
 return {manager:{id:2},admin:{id:3},garage:{id:4},warehouse:{id:5}};
}
const proposal=(kind,targetId,payload)=>({requestKey:randomUUID(),kind,targetId,payload,reason:'Verified test exception'});
const request=(actor,p)=>transact(()=>createRequest(client,actor,p));
const decide=(actor,id,action='APPROVE')=>transact(()=>decideRequest(client,actor,id,action,'Reviewed supporting evidence'));

test('department page rules isolate staff and allow management visibility',()=>{
 for(const path of ['/pos','/warehouse','/staff-garage','/admin','/operations']){
  assert.equal(canViewStaffPage('admin',path),true);assert.equal(canViewStaffPage('general_manager',path),true);
 }
 assert.equal(canViewStaffPage('garage_staff','/pos'),false);
 assert.equal(canViewStaffPage('cashier','/warehouse'),false);
 assert.equal(canViewStaffPage('warehouse_manager','/pos'),false);
 assert.equal(canViewStaffPage('warehouse_clerk','/warehouse/jeep'),true);
 assert.equal(canViewStaffPage('customer','/approvals'),false);
 assert.equal(staffDestination('general_manager'),'/staff');
 assert.equal(staffDestination('garage_staff','/pos'),'/staff-garage');
});
test('price request changes nothing until manager review and administrator apply; cannot apply twice',async()=>{
 const {manager,admin}=await team();const p=proposal('PRICE_CHANGE',1,{priceKes:120});
 const r=await request(user,p);const retry=await request(user,p);assert.equal(retry.id,r.id);
 assert.equal((await client.query('SELECT price_kes FROM products WHERE id=1')).rows[0].price_kes,100);
 await assert.rejects(decide(admin,r.id),/not awaiting/);
 assert.equal((await decide(manager,r.id)).status,'PENDING_ADMIN');
 assert.equal((await client.query('SELECT price_kes FROM products WHERE id=1')).rows[0].price_kes,100);
 assert.equal((await decide(admin,r.id)).status,'APPLIED');
 assert.equal((await client.query('SELECT price_kes FROM products WHERE id=1')).rows[0].price_kes,120);
 await assert.rejects(decide(admin,r.id),/not awaiting/);
 assert.equal((await client.query("SELECT COUNT(*)::int n FROM warehouse_audit WHERE action='REQUEST_APPLIED'")).rows[0].n,1);
});
test('general manager requests need administrator; staff cannot approve; stale changes require a new request',async()=>{
 const {manager,admin}=await team();const r=await request(manager,proposal('PRICE_CHANGE',1,{priceKes:90}));
 assert.equal(r.status,'PENDING_ADMIN');
 await assert.rejects(decide(manager,r.id),/not awaiting/);await assert.rejects(decide(user,r.id),/not awaiting/);
 await client.query('UPDATE products SET price_kes=101 WHERE id=1');
 await assert.rejects(decide(admin,r.id),/original record changed/);
 assert.equal((await decide(admin,r.id,'REJECT')).status,'REJECTED');
 assert.equal((await client.query('SELECT price_kes FROM products WHERE id=1')).rows[0].price_kes,101);
});
test('administrator requests still need independent manager review',async()=>{
 const {manager,admin}=await team();const r=await request(admin,proposal('PRICE_CHANGE',1,{priceKes:110}));
 await assert.rejects(decide(admin,r.id),/not awaiting/);
 await decide(manager,r.id);assert.equal((await decide(admin,r.id)).status,'APPLIED');
});
test('current database role controls requests and sales even with a stale actor object',async()=>{
 const {manager,garage}=await team();
 await assert.rejects(request(garage,proposal('PRICE_CHANGE',1,{priceKes:1})),/department/);
 await assert.rejects(request(user,proposal('STOCK_ADJUSTMENT',1,{quantity:0})),/department/);
 await assert.rejects(transact(()=>createCounterSale(client,manager,body())),/cannot create sales/);
 await client.query("UPDATE customers SET role='garage_staff' WHERE id=1");
 await assert.rejects(sell(body()),/denied/);
 await assert.rejects(request(user,proposal('PRICE_CHANGE',1,{priceKes:1})),/department/);
});
test('stock adjustment is audited, preserves reservations and refuses a stale physical count',async()=>{
 const {manager,admin,warehouse}=await team();await reserve(3);
 const r=await request(warehouse,proposal('STOCK_ADJUSTMENT',1,{quantity:2}));
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,7);
 await decide(manager,r.id);await decide(admin,r.id);
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,5);
 assert.equal((await client.query('SELECT available_qty FROM inventory_batches WHERE id=1')).rows[0].available_qty,2);
 assert.equal((await client.query("SELECT quantity FROM inventory_movements WHERE movement_type='ADJUSTMENT'")).rows[0].quantity,-2);
 const pending=await request(warehouse,proposal('STOCK_ADJUSTMENT',2,{quantity:5}));await decide(manager,pending.id);
 await sell(body({items:[{id:1,quantity:1}],tenderedKes:100}));
 await assert.rejects(decide(admin,pending.id),/original record changed/);
 await assert.rejects(request(warehouse,proposal('STOCK_ADJUSTMENT',2,{quantity:0})),/Insufficient/);
});
test('refund approval creates credit without restocking or sending payment; payout recording is admin-only and idempotent',async()=>{
 const {manager,admin}=await team();const sale=await sell(body());
 const r=await request(user,proposal('REFUND',sale.id,{source:'POS',amountKes:200}));
 await decide(manager,r.id);await decide(admin,r.id);
 const f=(await client.query('SELECT * FROM approved_refunds')).rows[0];assert.equal(f.status,'AWAITING_PAYOUT');assert.equal(f.amount_kes,200);
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,5);
 await assert.rejects(request(user,proposal('REFUND',sale.id,{source:'POS',amountKes:301})),/exceeds/);
 await assert.rejects(transact(()=>recordRefundPayout(client,manager,f.id,'CASH-VOUCHER-1')),/Only the administrator/);
 const a=await transact(()=>recordRefundPayout(client,admin,f.id,'CASH-VOUCHER-1'));
 assert.equal(a.status,'PAID');assert.equal((await transact(()=>recordRefundPayout(client,admin,f.id,'CASH-VOUCHER-1'))).id,a.id);
 await assert.rejects(transact(()=>recordRefundPayout(client,admin,f.id,'OTHER')),/already recorded/);
});
test('sale corrections are restricted, stale reviews cannot overwrite newer values',async()=>{
 const {manager,admin}=await team();const sale=await sell(body());
 const r=await request(user,proposal('SALE_CORRECTION',sale.id,{field:'customer_name',value:'Corrected Customer'}));
 await decide(manager,r.id);await decide(admin,r.id);
 assert.equal((await client.query('SELECT customer_name FROM counter_sales')).rows[0].customer_name,'Corrected Customer');
 await assert.rejects(request(user,proposal('SALE_CORRECTION',sale.id,{field:'total_kes',value:'1'})),/Choose/);
 await assert.rejects(request(user,proposal('SALE_CORRECTION',sale.id,{field:'payment_reference',value:'REF'})),/Cash sales/);
});
test('garage booking, idempotency, notes and forward progress work; manager writes and direct correction fail',async()=>{
 const {manager,admin,garage}=await team();const b={action:'CREATE',requestKey:randomUUID(),customerName:'Test Client',phone:'0700000000',vehicle:'Jeep',registration:'TEST 001',service:'Inspect brakes'};
 const save=(actor,data)=>transact(()=>saveGarageJob(client,actor,data));
 await assert.rejects(save(manager,b),/editing access/);await assert.rejects(save(user,b),/editing access/);
 const j=await save(garage,b);assert.equal((await save(garage,b)).id,j.id);
 await assert.rejects(save(garage,{...b,customerName:'Changed'}),/already used/);
 const progressed=await save(garage,{action:'PROGRESS',id:j.id,version:1,status:'INSPECTION',note:'Vehicle checked in'});
 assert.equal(progressed.status,'INSPECTION');
 await assert.rejects(save(garage,{action:'NOTE',id:j.id,version:1,note:'stale'}),/changed/);
 await assert.rejects(save(garage,{action:'PROGRESS',id:j.id,version:2,status:'BOOKED',note:'undo'}),/require approval/);
 const r=await request(garage,proposal('GARAGE_CORRECTION',j.id,{field:'registration',value:'TEST 002'}));
 await decide(manager,r.id);await decide(admin,r.id);
 assert.equal((await client.query('SELECT registration FROM garage_jobs')).rows[0].registration,'TEST 002');
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,10);
});

test('online refunds require paid orders and prevent payment rewrites after a credit',async()=>{
 const {manager,admin}=await team();await reserve(3);
 await assert.rejects(request(manager,proposal('REFUND',1,{source:'ONLINE',amountKes:100})),/paid online/);
 await client.query("UPDATE orders SET payment_status='Paid' WHERE id=1");
 const r=await request(manager,proposal('REFUND',1,{source:'ONLINE',amountKes:100}));await decide(admin,r.id);
 await assert.rejects(request(manager,proposal('ORDER_CORRECTION',1,{paymentStatus:'Failed'})),/cannot be rewritten/);
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,7);
});
test('approved online cancellation restores unpicked reservations once',async()=>{
 const {manager,admin}=await team();await reserve(3);
 const r=await request(manager,proposal('ORDER_CORRECTION',1,{status:'Cancelled'}));
 await decide(admin,r.id);await assert.rejects(decide(admin,r.id),/not awaiting/);
 assert.equal((await client.query('SELECT stock FROM products')).rows[0].stock,10);
 assert.equal((await client.query('SELECT status FROM orders')).rows[0].status,'Cancelled');
 await assert.rejects(request(manager,proposal('ORDER_CORRECTION',1,{status:'Pending'})),/cannot be reopened/);
});
