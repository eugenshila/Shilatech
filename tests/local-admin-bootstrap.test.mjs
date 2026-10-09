import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { PGlite } from '@electric-sql/pglite';
import { assertLocalDatabase, createLocalAdministrator } from '../lib/local-admin.mjs';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('local administrator setup refuses hosted databases and production', () => {
  assert.doesNotThrow(() => assertLocalDatabase('postgresql://postgres:password@localhost:5432/shilatech_local', 'development'));
  assert.throws(() => assertLocalDatabase('postgresql://postgres:password@db.example.com:5432/shilatech', 'development'), /localhost/);
  assert.throws(() => assertLocalDatabase('postgresql://postgres:password@localhost:5432/shilatech_local', 'production'), /production/);
  assert.throws(() => assertLocalDatabase('postgresql://postgres@localhost/db?host=db.example.com', 'development'), /localhost/);
});

test('local administrator gets a random temporary password, must change it, and cannot be recreated', async () => {
  const db = new PGlite();
  try {
    for (const path of ['../scripts/migrate.mjs', '../scripts/migrate-fulfillment.mjs']) {
      const source = await read(path);
      await db.exec(source.match(/const schema\s*=\s*`([\s\S]*?)`;/)[1]);
    }
    await db.exec(await read('../scripts/locations-pos.sql'));
    await db.exec(await read('../scripts/staff-workflows.sql'));
    await db.query('BEGIN');
    const password = await createLocalAdministrator(db, 'Eugene.Shilachilu@outlook.com', 'Eugene');
    await db.query('COMMIT');
    const rows = (await db.query("SELECT email,role,must_change_password,password_hash,location_id FROM customers WHERE email='eugene.shilachilu@outlook.com'")).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].role, 'admin');
    assert.equal(rows[0].must_change_password, true);
    assert.ok(rows[0].location_id);
    assert.ok(await bcrypt.compare(password, rows[0].password_hash));
    assert.notEqual(rows[0].password_hash, password);
    await assert.rejects(createLocalAdministrator(db, 'Eugene.Shilachilu@outlook.com'), /already has an account/);
    const after = (await db.query("SELECT password_hash FROM customers WHERE email='eugene.shilachilu@outlook.com'")).rows[0];
    assert.equal(after.password_hash, rows[0].password_hash);
  } finally {
    await db.close();
  }
});
