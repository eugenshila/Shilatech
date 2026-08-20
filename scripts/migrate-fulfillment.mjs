import pg from 'pg';

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const schema = `
CREATE TABLE IF NOT EXISTS warehouse_orders (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  job_no TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  assigned_to BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_order_items (
  id BIGSERIAL PRIMARY KEY,
  warehouse_order_id BIGINT NOT NULL REFERENCES warehouse_orders(id) ON DELETE CASCADE,
  order_item_id BIGINT UNIQUE NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  storage_area_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
  brand TEXT NOT NULL,
  part_no TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  picked_qty INTEGER NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
  status TEXT NOT NULL DEFAULT 'WAITING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_orders_status ON warehouse_orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_warehouse_order_items_job ON warehouse_order_items(warehouse_order_id, status);
`;

try {
  await pool.query(schema);
  console.log('Warehouse fulfillment migration complete.');
} finally {
  await pool.end();
}
