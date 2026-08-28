BEGIN;
CREATE TABLE IF NOT EXISTS business_locations (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE CHECK (NOT active OR code='MAIN'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO business_locations(code,name,active) VALUES ('MAIN','Main Warehouse & Sales Counter',TRUE)
ON CONFLICT(code) DO NOTHING;
CREATE OR REPLACE FUNCTION main_business_location_id() RETURNS BIGINT LANGUAGE SQL STABLE AS $$ SELECT id FROM business_locations WHERE code='MAIN' $$;
-- Only MAIN is operational in this release. Branch activation requires scoped warehouse workflows.
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS location_id BIGINT REFERENCES business_locations(id);
UPDATE warehouses SET location_id=(SELECT id FROM business_locations WHERE code='MAIN') WHERE location_id IS NULL;
ALTER TABLE warehouses ALTER COLUMN location_id SET NOT NULL;
ALTER TABLE warehouses ALTER COLUMN location_id SET DEFAULT main_business_location_id();
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_brand_area ON warehouses(location_id,brand_code) WHERE storage_type='BRAND' AND active;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS location_id BIGINT REFERENCES business_locations(id);
UPDATE customers SET location_id=(SELECT id FROM business_locations WHERE code='MAIN') WHERE role<>'customer' AND location_id IS NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_id BIGINT REFERENCES business_locations(id);
UPDATE orders SET location_id=(SELECT id FROM business_locations WHERE code='MAIN') WHERE location_id IS NULL;
ALTER TABLE orders ALTER COLUMN location_id SET DEFAULT main_business_location_id();
CREATE INDEX IF NOT EXISTS idx_warehouses_location ON warehouses(location_id);

CREATE OR REPLACE VIEW location_stock AS
WITH physical AS (
 SELECT b.product_id,w.location_id,SUM(b.available_qty)::bigint AS physical_qty
 FROM inventory_batches b JOIN warehouses w ON w.id=b.warehouse_id
 WHERE b.status='AVAILABLE' AND w.active AND w.storage_type='BRAND'
 GROUP BY b.product_id,w.location_id
), reserved AS (
 SELECT wi.product_id,w.location_id,SUM(GREATEST(wi.quantity-wi.picked_qty,0))::bigint AS reserved_qty
 FROM warehouse_order_items wi JOIN warehouse_orders wo ON wo.id=wi.warehouse_order_id
 JOIN warehouses w ON w.id=wi.storage_area_id
 WHERE wo.status<>'CANCELLED'
 GROUP BY wi.product_id,w.location_id
)
SELECT p.id AS product_id,l.id AS location_id,
 COALESCE(ph.physical_qty,0) AS physical_qty,COALESCE(r.reserved_qty,0) AS reserved_qty,
 GREATEST(COALESCE(ph.physical_qty,0)-COALESCE(r.reserved_qty,0),0) AS available_qty
FROM products p CROSS JOIN business_locations l
LEFT JOIN physical ph ON ph.product_id=p.id AND ph.location_id=l.id
LEFT JOIN reserved r ON r.product_id=p.id AND r.location_id=l.id;

CREATE TABLE IF NOT EXISTS counter_sales (
 id BIGSERIAL PRIMARY KEY,
 sale_no TEXT UNIQUE NOT NULL,
 request_key UUID UNIQUE NOT NULL,
 request_hash TEXT NOT NULL,
 location_id BIGINT NOT NULL REFERENCES business_locations(id),
 cashier_id BIGINT NOT NULL REFERENCES customers(id),
 customer_name TEXT NOT NULL DEFAULT 'Walk-in customer',
 payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash','M-Pesa','Card')),
 payment_reference TEXT,
 total_kes INTEGER NOT NULL CHECK(total_kes>0),
 tendered_kes INTEGER NOT NULL CHECK(tendered_kes>=total_kes),
 change_kes INTEGER NOT NULL CHECK(change_kes=tendered_kes-total_kes),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(payment_method='Cash' OR (length(trim(payment_reference))>0 AND payment_reference IS NOT NULL AND change_kes=0))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_counter_payment_reference ON counter_sales(payment_method,upper(payment_reference)) WHERE payment_method<>'Cash';
CREATE TABLE IF NOT EXISTS counter_sale_items (
 id BIGSERIAL PRIMARY KEY,
 sale_id BIGINT NOT NULL REFERENCES counter_sales(id),
 product_id BIGINT NOT NULL REFERENCES products(id),
 part_no TEXT NOT NULL,
 name TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity>0),
 unit_price_kes INTEGER NOT NULL CHECK(unit_price_kes>=0),
 line_total_kes INTEGER NOT NULL CHECK(line_total_kes=quantity*unit_price_kes)
);
CREATE TABLE IF NOT EXISTS counter_sale_allocations (
 sale_item_id BIGINT NOT NULL REFERENCES counter_sale_items(id),
 batch_id BIGINT NOT NULL REFERENCES inventory_batches(id),
 quantity INTEGER NOT NULL CHECK(quantity>0),
 unit_cost_kes INTEGER,
 PRIMARY KEY(sale_item_id,batch_id)
);
CREATE INDEX IF NOT EXISTS idx_counter_sales_location_date ON counter_sales(location_id,created_at);
COMMIT;
