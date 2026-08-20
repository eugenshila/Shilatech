import pg from 'pg';
const {Pool}=pg;const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false});
const sql=`
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_service_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_eta TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS destination_country TEXT NOT NULL DEFAULT 'Kenya';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tax_kes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_duty_kes INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS delivery_services(
 id bigserial primary key,code text unique not null,name text not null,scope text not null default 'LOCAL',hours integer,base_cost_kes integer not null default 0,active boolean not null default true,sort_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
INSERT INTO delivery_services(code,name,scope,hours,base_cost_kes,sort_order) VALUES
 ('LOCAL_2H','2 Hour Delivery','LOCAL',2,1200,10),('LOCAL_4H','4 Hour Delivery','LOCAL',4,900,20),('LOCAL_8H','8 Hour Delivery','LOCAL',8,700,30),('LOCAL_NEXT','Next Day Delivery','LOCAL',24,500,40),('INTL_EST','International Shipping — Estimate','INTERNATIONAL',NULL,0,50)
ON CONFLICT(code) DO NOTHING;
`;
try{await pool.query(sql);console.log('Shipping migration complete');}finally{await pool.end();}
