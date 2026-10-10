// Converts legacy picker/packer staff accounts into the warehouse_operator role.
// Safe to run repeatedly: once converted, no picker/packer rows remain.
import pg from 'pg';
import { pathToFileURL } from 'node:url';

export const LEGACY_ROLES = ['picker', 'packer'];

export async function migrateWarehouseOperator(db) {
  const result = await db.query(
    `WITH previous AS (
       SELECT id, role AS previous_role FROM customers WHERE role = ANY($1::text[])
     )
     UPDATE customers c SET role = 'warehouse_operator'
       FROM previous p
      WHERE c.id = p.id
     RETURNING c.id, p.previous_role`,
    [LEGACY_ROLES]
  );
  for (const row of result.rows) {
    await db.query(
      `INSERT INTO warehouse_audit (employee_id, action, entity_type, entity_id, details) VALUES ($1, 'ROLE_MIGRATED', 'customer', $2, $3::jsonb)`,
      [Number(row.id), String(row.id), JSON.stringify({ from: row.previous_role, to: 'warehouse_operator' })]
    );
  }
  return result.rows.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const converted = await migrateWarehouseOperator(client);
    await client.query('COMMIT');
    console.log(`Warehouse operator migration complete. Converted ${converted} picker/packer account(s).`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
