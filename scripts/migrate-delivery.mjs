import pg from 'pg';

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const schema = `
CREATE TABLE IF NOT EXISTS delivery_jobs (
  id BIGSERIAL PRIMARY KEY,
  warehouse_order_id BIGINT UNIQUE NOT NULL REFERENCES warehouse_orders(id) ON DELETE CASCADE,
  driver_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'READY',
  recipient_name TEXT,
  signature_data TEXT,
  gps_lat NUMERIC(10,7),
  gps_lng NUMERIC(10,7),
  delivery_notes TEXT,
  signed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_status ON delivery_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_driver ON delivery_jobs(driver_id, status, created_at);
`;

try {
  await pool.query(schema);
  console.log('Delivery/PDA migration complete.');
} finally {
  await pool.end();
}
