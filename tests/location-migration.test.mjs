import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('a fresh location migration prepares the admin password column before staff workflows', async () => {
  const db = new PGlite();
  try {
    for (const path of ['../scripts/migrate.mjs', '../scripts/migrate-fulfillment.mjs']) {
      const source = await read(path);
      await db.exec(source.match(/const schema\s*=\s*`([\s\S]*?)`;/)[1]);
    }
    const locations = await read('../scripts/locations-pos.sql');
    await db.exec(locations);
    const admin = await db.query("SELECT must_change_password FROM customers WHERE role='admin'");
    assert.deepEqual(admin.rows, [{ must_change_password: true }]);

    await db.exec(await read('../scripts/staff-workflows.sql'));
    await db.exec(locations);
    const count = await db.query("SELECT COUNT(*)::int AS n FROM customers WHERE role='admin'");
    assert.equal(count.rows[0].n, 1);
  } finally {
    await db.close();
  }
});
