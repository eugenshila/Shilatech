import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false});
const schema=`
CREATE TABLE IF NOT EXISTS payment_requests (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'MPESA',
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  phone TEXT,
  amount_kes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  result_code TEXT,
  result_desc TEXT,
  receipt_no TEXT,
  raw_response JSONB,
  created_by BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_requests_order ON payment_requests(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_checkout ON payment_requests(checkout_request_id);
`;
try{await pool.query(schema);console.log('Payment migration complete.');}finally{await pool.end();}
