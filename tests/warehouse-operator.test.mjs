import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const swc = require('next/dist/build/swc');

const { staffDestination, staffPages, canViewStaffPage } = await import('../lib/staff-access.mjs');
const { employeeShortcuts } = await import('../lib/staff-dashboard.mjs');
const { migrateWarehouseOperator } = await import('../scripts/migrate-warehouse-operator.mjs');
const proof = await import('../lib/delivery-complete.js');

test('warehouse operator gets the one warehouse destination; picker and packer are gone', () => {
  assert.equal(staffDestination('warehouse_operator', '/warehouse'), '/warehouse');
  assert.deepEqual(staffPages('warehouse_operator').filter(p => !['/approvals', '/my-hr'].includes(p)), ['/warehouse']);
  assert.equal(canViewStaffPage('warehouse_operator', '/warehouse/jeep'), true);
  assert.equal(canViewStaffPage('warehouse_operator', '/pos'), false);
  assert.equal(staffDestination('picker', '/warehouse'), null);
  assert.equal(staffDestination('packer', '/warehouse'), null);
  assert.deepEqual(staffPages('picker'), []);
  assert.deepEqual(staffPages('packer'), []);
});

test('warehouse access list, API role sets and admin role list agree on the new role', () => {
  const auth = fs.readFileSync(path.join(root, 'lib/warehouse-auth.js'), 'utf8');
  assert.match(auth, /'warehouse_operator'/);
  assert.doesNotMatch(auth, /'picker'|'packer'/);
  const staffApi = fs.readFileSync(path.join(root, 'pages/api/admin/staff.js'), 'utf8');
  assert.match(staffApi, /'warehouse_operator'/);
  assert.doesNotMatch(staffApi, /'picker'|'packer'/);
  for (const f of ['pages/admin.js', 'pages/warehouse.js', 'pages/api/warehouse/orders/process.js', 'lib/staff-access.mjs', 'lib/delivery-auth.js']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, f), 'utf8'), /picker|packer/, f);
  }
});

test('operator keeps the staff dashboard shortcut card for fulfilment', () => {
  const cards = employeeShortcuts('warehouse_operator', '/approvals');
  assert.ok(cards.some(c => c.href === '/warehouse'));
});

test('proof-of-delivery input is validated the same way for every screen', () => {
  assert.throws(() => proof.parseProofOfDelivery({ deliveryId: 1, recipientName: '', signatureData: 'data:image/png;base64,AA' }), /required/);
  assert.throws(() => proof.parseProofOfDelivery({ deliveryId: 1, recipientName: 'Jane', signatureData: 'not-an-image' }), /required/);
  assert.throws(() => proof.parseProofOfDelivery({ deliveryId: 1, recipientName: 'Jane', signatureData: 'data:image/png;base64,' + 'A'.repeat(proof.MAX_SIGNATURE_LENGTH) }), /too large/);
  const ok = proof.parseProofOfDelivery({ deliveryId: '7', recipientName: ' Jane ', signatureData: 'data:image/png;base64,AA', lat: '-1.28', lng: null });
  assert.equal(ok.deliveryId, 7);
  assert.equal(ok.recipientName, 'Jane');
  assert.equal(ok.lat, -1.28);
  assert.equal(ok.lng, null);
  assert.equal(ok.notes, null);
  assert.ok(proof.PROOF_ROLES.includes('warehouse_operator'));
  assert.ok(!proof.PROOF_ROLES.includes('picker'));
});

test('M-Pesa gate and delivery completion rules hold inside a transaction', async () => {
  const db = new PGlite();
  await db.exec(`
    CREATE TABLE customers(id INTEGER PRIMARY KEY, role TEXT);
    CREATE TABLE orders(id INTEGER PRIMARY KEY, order_no TEXT, status TEXT, payment_method TEXT, payment_status TEXT, updated_at TIMESTAMPTZ);
    CREATE TABLE warehouse_orders(id INTEGER PRIMARY KEY, order_id INTEGER, job_no TEXT, status TEXT, updated_at TIMESTAMPTZ);
    CREATE TABLE delivery_jobs(id INTEGER PRIMARY KEY, warehouse_order_id INTEGER UNIQUE, driver_id INTEGER, status TEXT,
      recipient_name TEXT, signature_data TEXT, gps_lat NUMERIC, gps_lng NUMERIC, delivery_notes TEXT, signed_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ, updated_at TIMESTAMPTZ);
    CREATE TABLE warehouse_audit(id SERIAL PRIMARY KEY, employee_id INTEGER, action TEXT, entity_type TEXT, entity_id TEXT, details JSONB);
    INSERT INTO customers VALUES (10,'warehouse_operator'),(11,'delivery_driver'),(12,'delivery_driver');
    INSERT INTO orders VALUES (1,'SHL-1','Out for Delivery','M-Pesa','Pending'),(2,'SHL-2','Out for Delivery','Cash','Pending'),(3,'SHL-3','Out for Delivery','M-Pesa','Paid');
    INSERT INTO warehouse_orders VALUES (1,1,'WH-1','OUT_FOR_DELIVERY'),(2,2,'WH-2','OUT_FOR_DELIVERY'),(3,3,'WH-3','OUT_FOR_DELIVERY');
    INSERT INTO delivery_jobs(id,warehouse_order_id,driver_id,status) VALUES (1,1,NULL,'OUT_FOR_DELIVERY'),(2,2,NULL,'OUT_FOR_DELIVERY'),(3,3,12,'OUT_FOR_DELIVERY');
  `);
  const operator = { sub: 10, role: 'warehouse_operator' };
  const input = proof.parseProofOfDelivery({ deliveryId: 1, recipientName: 'Jane', signatureData: 'data:image/png;base64,AA' });
  const attempt = async (actor, data) => {
    await db.query('BEGIN');
    try { const r = await proof.completeProofOfDelivery(db, actor, data); await db.query('COMMIT'); return r; }
    catch (e) { await db.query('ROLLBACK'); throw e; }
  };

  await assert.rejects(attempt(operator, input), /Payment is still pending/);
  await db.query(`UPDATE orders SET payment_status='Paid' WHERE id=1`);
  const done = await attempt(operator, input);
  assert.equal(done.status, 'Delivered');
  assert.equal((await db.query(`SELECT status FROM delivery_jobs WHERE id=1`)).rows[0].status, 'DELIVERED');
  assert.equal((await db.query(`SELECT status FROM warehouse_orders WHERE id=1`)).rows[0].status, 'COMPLETED');
  assert.equal((await db.query(`SELECT status FROM orders WHERE id=1`)).rows[0].status, 'Delivered');
  const audit = (await db.query(`SELECT details FROM warehouse_audit WHERE action='PROOF_OF_DELIVERY'`)).rows[0].details;
  assert.equal(audit.actorRole, 'warehouse_operator');
  await assert.rejects(attempt(operator, { ...input }), /already completed/);

  // Cash orders need no M-Pesa payment.
  await attempt(operator, proof.parseProofOfDelivery({ deliveryId: 2, recipientName: 'Ken', signatureData: 'data:image/png;base64,AA' }));

  // A driver cannot complete another driver's job.
  await assert.rejects(attempt({ sub: 11, role: 'delivery_driver' }, proof.parseProofOfDelivery({ deliveryId: 3, recipientName: 'X', signatureData: 'data:image/png;base64,AA' })), /another driver/);
  await attempt({ sub: 12, role: 'delivery_driver' }, proof.parseProofOfDelivery({ deliveryId: 3, recipientName: 'X', signatureData: 'data:image/png;base64,AA' }));
  await db.close?.();
});

test('legacy picker and packer accounts migrate to warehouse_operator once', async () => {
  const db = new PGlite();
  await db.exec(`
    CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT, role TEXT NOT NULL DEFAULT 'customer');
    CREATE TABLE warehouse_audit(id SERIAL PRIMARY KEY, employee_id INTEGER, action TEXT, entity_type TEXT, entity_id TEXT, details JSONB);
    INSERT INTO customers VALUES (1,'Pick','picker'),(2,'Pack','packer'),(3,'Dispatch','dispatch'),(4,'Clerk','warehouse_clerk'),(5,'Buyer','customer');
  `);
  assert.equal(await migrateWarehouseOperator(db), 2);
  const roles = Object.fromEntries((await db.query('SELECT id, role FROM customers ORDER BY id')).rows.map(r => [r.id, r.role]));
  assert.deepEqual(roles, { 1: 'warehouse_operator', 2: 'warehouse_operator', 3: 'dispatch', 4: 'warehouse_clerk', 5: 'customer' });
  assert.equal(await migrateWarehouseOperator(db), 0);
  const audit = (await db.query(`SELECT details FROM warehouse_audit ORDER BY id`)).rows.map(r => r.details);
  assert.deepEqual(audit.map(a => a.from).sort(), ['packer', 'picker']);
});

test('fulfilment card and warehouse page compile', async () => {
  for (const f of ['components/FulfilmentQueue.js', 'pages/warehouse.js', 'pages/delivery.js', 'pages/api/delivery/complete.js', 'pages/api/warehouse/orders/process.js', 'lib/delivery-complete.js']) {
    await swc.transform(fs.readFileSync(path.join(root, f), 'utf8'), { filename: path.basename(f), jsc: { parser: { syntax: 'ecmascript', jsx: f.startsWith('components/') || f.startsWith('pages/') && !f.startsWith('pages/api/') } } });
  }
});
