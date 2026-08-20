import pg from 'pg';
const { Pool }=pg; const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false});
const sql=`
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level integer NOT NULL DEFAULT 2;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_quantity integer NOT NULL DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_kes numeric(12,2);
CREATE TABLE IF NOT EXISTS suppliers(id bigserial primary key,name text not null,contact_name text,phone text,email text,address text,active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
CREATE TABLE IF NOT EXISTS purchase_orders(id bigserial primary key,po_no text unique not null,supplier_id bigint references suppliers(id),status text not null default 'DRAFT',expected_date date,notes text,created_by bigint references customers(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
CREATE TABLE IF NOT EXISTS purchase_order_items(id bigserial primary key,purchase_order_id bigint not null references purchase_orders(id) on delete cascade,product_id bigint not null references products(id),quantity integer not null check(quantity>0),received_quantity integer not null default 0,unit_cost_kes numeric(12,2),created_at timestamptz not null default now());
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(purchase_order_id);
`;
try{await pool.query(sql);console.log('V1 operations migration complete');}finally{await pool.end();}
