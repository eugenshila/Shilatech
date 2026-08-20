import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { brand, category, q, inStock, model, year } = req.query;
  const where = ['active = TRUE'];
  const params = [];
  const add = (clause, value) => {
    params.push(value);
    where.push(clause.replace('?', `$${params.length}`));
  };

  if (brand) add('brand = ?', brand);
  if (category) add('category = ?', category);
  if (inStock === 'true') where.push('stock > 0');
  if (q) {
    params.push(`%${q}%`);
    const p = `$${params.length}`;
    where.push(`(name ILIKE ${p} OR part_no ILIKE ${p} OR brand ILIKE ${p} OR category ILIKE ${p})`);
  }
  if (model) {
    params.push(model);
    where.push(`models ? $${params.length}`);
  }
  if (year) {
    params.push(String(year));
    where.push(`years IS NULL OR years ILIKE '%' || $${params.length} || '%'`);
  }

  try {
    const result = await query(
      `SELECT id, slug, name, brand, category, part_no AS "partNo", part_type AS type,
              price_kes AS price, stock, years, models, engine, rating, image_url AS "imageUrl"
       FROM products
       WHERE ${where.join(' AND ')}
       ORDER BY stock > 0 DESC, name ASC
       LIMIT 250`,
      params
    );
    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load products' });
  }
}
