import pg from 'pg';

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const schema = `
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  part_no TEXT UNIQUE NOT NULL,
  part_type TEXT NOT NULL DEFAULT 'Aftermarket',
  price_kes INTEGER NOT NULL CHECK (price_kes >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  years TEXT,
  models JSONB NOT NULL DEFAULT '[]'::jsonb,
  engine TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

CREATE TABLE IF NOT EXISTS garage_vehicles (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vin VARCHAR(17) NOT NULL,
  make TEXT,
  model TEXT,
  model_year TEXT,
  engine TEXT,
  trim TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, vin)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_zone TEXT NOT NULL DEFAULT 'Nairobi',
  subtotal_kes INTEGER NOT NULL,
  delivery_kes INTEGER NOT NULL DEFAULT 0,
  total_kes INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  part_no TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_kes INTEGER NOT NULL,
  line_total_kes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS brand_code TEXT;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS storage_type TEXT NOT NULL DEFAULT 'BRAND';

CREATE TABLE IF NOT EXISTS warehouse_bins (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  zone TEXT,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  bin_type TEXT NOT NULL DEFAULT 'STORAGE',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(warehouse_id, code)
);

CREATE TABLE IF NOT EXISTS inventory_batches (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  bin_id BIGINT REFERENCES warehouse_bins(id) ON DELETE SET NULL,
  batch_no TEXT NOT NULL,
  supplier_name TEXT,
  supplier_ref TEXT,
  received_qty INTEGER NOT NULL CHECK (received_qty > 0),
  available_qty INTEGER NOT NULL CHECK (available_qty >= 0),
  unit_cost_kes INTEGER CHECK (unit_cost_kes >= 0),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  created_by BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  UNIQUE(product_id, warehouse_id, batch_no)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id BIGINT REFERENCES inventory_batches(id) ON DELETE SET NULL,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  bin_id BIGINT REFERENCES warehouse_bins(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity <> 0),
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_by BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preorders (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  allocated_qty INTEGER NOT NULL DEFAULT 0 CHECK (allocated_qty >= 0),
  expected_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'OPEN',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS returns (
  id BIGSERIAL PRIMARY KEY,
  return_no TEXT UNIQUE NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  batch_id BIGINT REFERENCES inventory_batches(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  defect_type TEXT,
  disposition TEXT NOT NULL DEFAULT 'QUARANTINE',
  status TEXT NOT NULL DEFAULT 'OPEN',
  notes TEXT,
  reported_by BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS warehouse_audit (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_part_no ON products(part_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_batches_fifo ON inventory_batches(product_id, warehouse_id, received_at, id) WHERE available_qty > 0 AND status='AVAILABLE';
CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preorders_status ON preorders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_warehouses_brand ON warehouses(brand_code) WHERE active=TRUE;
`;

const seed = [
  ['mercedes-oil-filter-a2711800109','Mercedes-Benz Oil Filter','Mercedes-Benz','Engine','A2711800109','OEM',2800,18,'2008–2015',['C-Class','E-Class','GLK'],'1.8 / 2.0 Petrol',4.9],
  ['jeep-grand-cherokee-front-brake-pad','Jeep Grand Cherokee Front Brake Pad Set','Jeep','Brakes','68212327AA','Aftermarket',12500,9,'2014–2021',['Grand Cherokee'],'3.0 / 3.6 / 5.7',4.8],
  ['vw-golf-coil-pack','Volkswagen Ignition Coil Pack','Volkswagen','Electrical','06H905115B','OEM',6500,24,'2009–2018',['Golf','Passat','Tiguan'],'1.8 / 2.0 TSI',4.7],
  ['range-rover-air-suspension-compressor','Range Rover Air Suspension Compressor','Range Rover','Suspension','LR061888','Aftermarket',48000,4,'2013–2020',['Range Rover','Range Rover Sport'],'Multiple',4.9],
  ['volvo-xc60-control-arm','Volvo XC60 Front Control Arm','Volvo','Suspension','31317603','Aftermarket',18500,7,'2010–2017',['XC60'],'T5 / T6 / D4 / D5',4.6],
  ['mercedes-cabin-air-filter','Mercedes-Benz Cabin Air Filter','Mercedes-Benz','Interior','A2048300018','OEM',4200,15,'2007–2014',['C-Class','GLK'],'All',4.8],
  ['jeep-wrangler-wheel-bearing','Jeep Wrangler Front Wheel Bearing Hub','Jeep','Suspension','52060398AC','Aftermarket',16500,8,'2007–2018',['Wrangler'],'2.8 / 3.6 / 3.8',4.7],
  ['vw-passat-water-pump','Volkswagen Water Pump Assembly','Volkswagen','Engine','06H121026DD','OEM',22000,6,'2010–2018',['Passat','Tiguan','Golf'],'1.8 / 2.0 TSI',4.8]
];

const brandAreas = [
  ['JEEP','Jeep Storage Area','Jeep'],
  ['MERC','Mercedes-Benz Storage Area','Mercedes-Benz'],
  ['VW','Volkswagen Storage Area','Volkswagen'],
  ['RROVER','Range Rover / Land Rover Storage Area','Range Rover'],
  ['VOLVO','Volvo Storage Area','Volvo'],
  ['FORD','Ford Storage Area','Ford']
];

try {
  await pool.query(schema);
  await pool.query(`INSERT INTO warehouses (code,name,address,brand_code,storage_type) VALUES ('QUAR','Returns & Defect Quarantine','Nairobi',NULL,'QUARANTINE') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,storage_type='QUARANTINE',active=TRUE`);
  for (const [code,name,brand] of brandAreas) {
    await pool.query(`INSERT INTO warehouses (code,name,address,brand_code,storage_type) VALUES ($1,$2,'Nairobi',$3,'BRAND') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,brand_code=EXCLUDED.brand_code,storage_type='BRAND',active=TRUE`, [code,name,brand]);
  }
  for (const p of seed) {
    await pool.query(
      `INSERT INTO products (slug,name,brand,category,part_no,part_type,price_kes,stock,years,models,engine,rating,barcode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$5)
       ON CONFLICT (part_no) DO UPDATE SET
       name=EXCLUDED.name, brand=EXCLUDED.brand, category=EXCLUDED.category,
       part_type=EXCLUDED.part_type, price_kes=EXCLUDED.price_kes,
       years=EXCLUDED.years, models=EXCLUDED.models, engine=EXCLUDED.engine,
       rating=EXCLUDED.rating, barcode=COALESCE(products.barcode,EXCLUDED.barcode), updated_at=NOW()`,
      [...p.slice(0,9), JSON.stringify(p[9]), ...p.slice(10)]
    );
  }
  console.log('Database migration, brand storage areas and seed complete.');
} finally {
  await pool.end();
}
