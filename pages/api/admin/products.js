import { query } from '../../../lib/db';
import { readSession } from '../../../lib/auth';

function requireAdmin(req, res) {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: 'Sign in required.' }); return null; }
  if (session.role !== 'admin') { res.status(403).json({ error: 'Admin access required.' }); return null; }
  return session;
}

function cleanProduct(body = {}) {
  const name = String(body.name || '').trim();
  const brand = String(body.brand || '').trim();
  const category = String(body.category || '').trim();
  const partNo = String(body.partNo || '').trim();
  const partType = String(body.partType || 'Aftermarket').trim();
  const price = Number(body.priceKes);
  const stock = Number(body.stock);
  const years = String(body.years || '').trim();
  const engine = String(body.engine || '').trim();
  const models = Array.isArray(body.models) ? body.models.map(String).map(x=>x.trim()).filter(Boolean) : String(body.models || '').split(',').map(x=>x.trim()).filter(Boolean);
  if (!name || !brand || !category || !partNo || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) throw new Error('Invalid product details.');
  const slug = String(body.slug || `${brand}-${partNo}-${name}`).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return { name, brand, category, partNo, partType, price, stock, years, engine, models, slug, active: body.active !== false };
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    if (req.method === 'POST') {
      const p = cleanProduct(req.body);
      if(p.stock!==0)throw new Error('Create the part with zero stock, then receive its opening batch in the warehouse.');
      const result = await query(`INSERT INTO products (slug,name,brand,category,part_no,part_type,price_kes,stock,years,models,engine,active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)
        RETURNING *`, [p.slug,p.name,p.brand,p.category,p.partNo,p.partType,p.price,p.stock,p.years,JSON.stringify(p.models),p.engine,p.active]);
      return res.status(201).json({ product: result.rows[0] });
    }
    if (req.method === 'PUT') {
      const id = Number(req.body?.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Product id is required.' });
      const p = cleanProduct(req.body);
      const result = await query(`UPDATE products SET slug=$1,name=$2,brand=$3,category=$4,part_no=$5,part_type=$6,price_kes=$7,years=$9,models=$10::jsonb,engine=$11,active=$12,updated_at=NOW() WHERE id=$13 AND stock=$8 AND (brand=$3 OR NOT EXISTS(SELECT 1 FROM inventory_batches WHERE product_id=$13)) RETURNING *`, [p.slug,p.name,p.brand,p.category,p.partNo,p.partType,p.price,p.stock,p.years,JSON.stringify(p.models),p.engine,p.active,id]);
      if (!result.rowCount) return res.status(409).json({ error: 'Reload this product. Stock must be changed through receiving/issuing; the brand of a batched part cannot be changed.' });
      return res.status(200).json({ product: result.rows[0] });
    }
    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Product id is required.' });
      const result = await query(`UPDATE products SET active=FALSE,updated_at=NOW() WHERE id=$1 RETURNING id`, [id]);
      if (!result.rowCount) return res.status(404).json({ error: 'Product not found.' });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') return res.status(409).json({ error: 'Part number or slug already exists.' });
    res.status(400).json({ error: error.message || 'Could not update product.' });
  }
}
