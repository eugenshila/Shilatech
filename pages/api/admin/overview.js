import { query } from '../../../lib/db';
import { readSession } from '../../../lib/auth';

function requireAdmin(req, res) {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: 'Sign in required.' }); return null; }
  if (session.role !== 'admin') { res.status(403).json({ error: 'Admin access required.' }); return null; }
  return session;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  try {
    const [sales, openOrders, lowStock, customers, recentOrders, products] = await Promise.all([
      query(`SELECT COALESCE(SUM(total_kes),0) AS total FROM (SELECT total_kes,created_at FROM orders WHERE payment_status IN ('Paid','Completed') UNION ALL SELECT total_kes,created_at FROM counter_sales) sales WHERE (created_at AT TIME ZONE 'Africa/Nairobi')::date=(NOW() AT TIME ZONE 'Africa/Nairobi')::date`),
      query(`SELECT COUNT(*)::int AS total FROM orders WHERE status NOT IN ('Delivered','Cancelled')`),
      query(`SELECT COUNT(*)::int AS total FROM products WHERE active=TRUE AND stock <= 5`),
      query(`SELECT COUNT(*)::int AS total FROM customers`),
      query(`SELECT id,order_no,customer_name,total_kes,payment_method,payment_status,status,created_at FROM orders ORDER BY created_at DESC LIMIT 12`),
      query(`SELECT id,slug,name,brand,category,part_no,part_type,price_kes,stock,active,updated_at FROM products ORDER BY updated_at DESC,name ASC LIMIT 100`)
    ]);
    res.status(200).json({
      metrics: {
        salesToday: sales.rows[0].total,
        openOrders: openOrders.rows[0].total,
        lowStock: lowStock.rows[0].total,
        customers: customers.rows[0].total
      },
      recentOrders: recentOrders.rows,
      products: products.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load admin dashboard.' });
  }
}
