import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'shilatech.db')

function openDb(){
  // ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data')
  if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const db = new Database(DB_PATH)
  return db
}

export function initDb(){
  const db = openDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      sku TEXT PRIMARY KEY,
      slug TEXT,
      name TEXT,
      brand TEXT,
      category TEXT,
      compatibility TEXT,
      part_number TEXT,
      oem_number TEXT,
      price REAL,
      stock_status TEXT,
      image TEXT,
      featured INTEGER,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      make TEXT,
      model TEXT,
      year TEXT,
      engine TEXT,
      registration TEXT,
      vin TEXT,
      part_required TEXT,
      part_number TEXT,
      notes TEXT,
      images TEXT,
      created_at TEXT
    );
  `)

  // migrate products from JSON if products table empty
  const row = db.prepare('SELECT COUNT(1) as c FROM products').get()
  if(row && row.c === 0){
    const pjson = path.join(process.cwd(), 'data', 'products.json')
    if(fs.existsSync(pjson)){
      const raw = fs.readFileSync(pjson, 'utf8')
      try{
        const arr = JSON.parse(raw)
        const insert = db.prepare(`INSERT OR REPLACE INTO products (sku,slug,name,brand,category,compatibility,part_number,oem_number,price,stock_status,image,featured,description) VALUES (@sku,@slug,@name,@brand,@category,@compatibility,@part_number,@oem_number,@price,@stock_status,@image,@featured,@description)`)
        const insertMany = db.transaction((items:any[])=>{
          for(const it of items){
            insert.run({
              sku: it.sku,
              slug: it.slug,
              name: it.name,
              brand: it.brand,
              category: it.category,
              compatibility: JSON.stringify(it.compatibility||[]),
              part_number: it.part_number,
              oem_number: it.oem_number,
              price: it.price,
              stock_status: it.stock_status,
              image: it.image,
              featured: it.featured?1:0,
              description: it.description
            })
          }
        })
        insertMany(arr)
      }catch(e){ console.error('products.json parse error', e) }
    }
  }

  db.close()
}

export function getAllProducts(){
  const db = openDb()
  const rows = db.prepare('SELECT * FROM products ORDER BY name').all()
  db.close()
  return rows.map(r=>({ ...r, compatibility: JSON.parse(r.compatibility || '[]'), featured: !!r.featured }))
}

export function getProductBySlug(slug:string){
  const db = openDb()
  const row = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug)
  db.close()
  if(!row) return null
  return { ...row, compatibility: JSON.parse(row.compatibility||'[]'), featured: !!row.featured }
}

export function upsertProduct(p:any){
  const db = openDb()
  db.prepare(`INSERT OR REPLACE INTO products (sku,slug,name,brand,category,compatibility,part_number,oem_number,price,stock_status,image,featured,description) VALUES (@sku,@slug,@name,@brand,@category,@compatibility,@part_number,@oem_number,@price,@stock_status,@image,@featured,@description)`)
    .run({
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category,
      compatibility: JSON.stringify(p.compatibility||[]),
      part_number: p.part_number,
      oem_number: p.oem_number,
      price: p.price,
      stock_status: p.stock_status,
      image: p.image,
      featured: p.featured?1:0,
      description: p.description
    })
  db.close()
}

export function deleteProduct(sku:string){
  const db = openDb()
  db.prepare('DELETE FROM products WHERE sku = ?').run(sku)
  db.close()
}

export function importProducts(items:any[]){
  const db = openDb()
  const insert = db.prepare(`INSERT OR REPLACE INTO products (sku,slug,name,brand,category,compatibility,part_number,oem_number,price,stock_status,image,featured,description) VALUES (@sku,@slug,@name,@brand,@category,@compatibility,@part_number,@oem_number,@price,@stock_status,@image,@featured,@description)`)
  const insertMany = db.transaction((rows:any[])=>{
    for(const it of rows){
      insert.run({
        sku: it.sku,
        slug: it.slug,
        name: it.name,
        brand: it.brand,
        category: it.category,
        compatibility: JSON.stringify(it.compatibility||[]),
        part_number: it.part_number,
        oem_number: it.oem_number,
        price: it.price,
        stock_status: it.stock_status,
        image: it.image,
        featured: it.featured?1:0,
        description: it.description
      })
    }
  })
  insertMany(items)
  db.close()
}

export function addRequest(r:any){
  const db = openDb()
  db.prepare(`INSERT INTO requests (id,name,phone,whatsapp,email,make,model,year,engine,registration,vin,part_required,part_number,notes,images,created_at) VALUES (@id,@name,@phone,@whatsapp,@email,@make,@model,@year,@engine,@registration,@vin,@part_required,@part_number,@notes,@images,@created_at)`)
    .run({
      id: r.id,
      name: r.name,
      phone: r.phone,
      whatsapp: r.whatsapp,
      email: r.email,
      make: r.make,
      model: r.model,
      year: r.year,
      engine: r.engine,
      registration: r.registration,
      vin: r.vin,
      part_required: r.part_required,
      part_number: r.part_number,
      notes: r.notes,
      images: JSON.stringify(r.images||[]),
      created_at: r.created_at
    })
  db.close()
}

export function getRequests(){
  const db = openDb()
  const rows = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all()
  db.close()
  return rows.map(r=>({ ...r, images: JSON.parse(r.images || '[]') }))
}
